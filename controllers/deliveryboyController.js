const Order = require("../models/order");
const Product = require("../models/product");
const { calculateDistanceKm } = require("../utils/locationData");

const populateDeliveryOrders = (query) =>
  query
    .populate("productId")
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("hostId", "firstName lastName email phoneNumber")
    .populate("deliveryBoyId", "firstName lastName email phoneNumber");

const createDeliveryOtp = () =>
  String(Math.floor(100000 + (Math.random() * 900000)));

const recalculateDeliveredProductRating = async (productId) => {
  const deliveredOrders = await Order.find({
    productId,
    status: "delivered"
  }).select("userRating");

  const ratedDeliveredOrders = deliveredOrders.filter((item) => (item.userRating?.stars || 0) > 0);
  const totalStars = ratedDeliveredOrders.reduce((sum, item) => sum + (item.userRating?.stars || 0), 0);
  const ratingCount = ratedDeliveredOrders.length;
  const averageRating = ratingCount > 0 ? Number((totalStars / ratingCount).toFixed(1)) : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: {
      stars: averageRating,
      count: ratingCount
    }
  });
};

exports.getDeliveryOrders = async (req, res, next) => {
  const deliveryBoyId = req.session.user._id;
  const success = req.session.success;
  const error = req.session.error;

  delete req.session.success;
  delete req.session.error;

  try {
    const [availableOrders, activeOrders, completedOrders] = await Promise.all([
      populateDeliveryOrders(
        Order.find({
          status: "ready_to_deliver",
          $or: [{ deliveryBoyId: { $exists: false } }, { deliveryBoyId: null }]
        }).sort({ orderDate: 1 })
      ),
      populateDeliveryOrders(
        Order.find({
          deliveryBoyId,
          status: { $in: ["shipped", "out_for_delivery"] }
        }).sort({ deliveryAcceptedAt: -1, orderDate: -1 })
      ),
      populateDeliveryOrders(
        Order.find({
          deliveryBoyId,
          status: "delivered"
        }).sort({ deliveryDate: -1, orderDate: -1 }).limit(10)
      )
    ]);

    res.render("delivery/orders", {
      availableOrders,
      activeOrders,
      completedOrders,
      pageTitle: "Delivery Dashboard",
      currentPage: "delivery-orders",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      success,
      error
    });
  } catch (err) {
    console.log("Error loading delivery dashboard:", err);
    next(err);
  }
};

exports.postAcceptDelivery = async (req, res) => {
  const deliveryBoyId = req.session.user._id.toString();
  const orderId = req.params.orderId;
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/delivery/orders");
    }

    if (order.status !== "ready_to_deliver") {
      req.session.error = "Only ready to deliver orders can be accepted";
      return res.redirect("/delivery/orders");
    }

    if (order.deliveryBoyId) {
      req.session.error = "This order has already been accepted by another delivery boy";
      return res.redirect("/delivery/orders");
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      req.session.error = "Please allow your current location before accepting an order";
      return res.redirect("/delivery/orders");
    }

    const distanceKm = calculateDistanceKm(
      { latitude, longitude },
      order.deliveryLocation
    );

    if (!Number.isFinite(distanceKm) || distanceKm > 20) {
      req.session.error = "You can accept only orders within 20 km of your current location";
      return res.redirect("/delivery/orders");
    }

    order.deliveryBoyId = req.session.user._id;
    order.deliveryAcceptedAt = new Date();
    order.deliveryOtp = createDeliveryOtp();
    order.deliveryOtpGeneratedAt = new Date();
    order.deliveryOtpVerifiedAt = undefined;
    order.status = "shipped";

    await order.save();

    req.session.success = "Order accepted successfully and marked as shipped.";
    return res.redirect("/delivery/orders");
  } catch (err) {
    console.log("Error accepting delivery order:", err);
    req.session.error = "Could not accept this delivery order";
    return res.redirect("/delivery/orders");
  }
};

exports.postStartOutForDelivery = async (req, res) => {
  const deliveryBoyId = req.session.user._id.toString();
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/delivery/orders");
    }

    if (String(order.deliveryBoyId || "") !== deliveryBoyId) {
      req.session.error = "You are not assigned to this order";
      return res.redirect("/delivery/orders");
    }

    if (order.status !== "shipped") {
      req.session.error = "Only shipped orders can move to out for delivery";
      return res.redirect("/delivery/orders");
    }

    order.status = "out_for_delivery";
    await order.save();

    req.session.success = "Order is now out for delivery.";
    return res.redirect("/delivery/orders");
  } catch (err) {
    console.log("Error starting out for delivery:", err);
    req.session.error = "Could not update this delivery order";
    return res.redirect("/delivery/orders");
  }
};

exports.postCompleteDelivery = async (req, res) => {
  const deliveryBoyId = req.session.user._id.toString();
  const orderId = req.params.orderId;
  const otp = String(req.body.otp || "").trim();

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/delivery/orders");
    }

    if (String(order.deliveryBoyId || "") !== deliveryBoyId) {
      req.session.error = "You are not assigned to this order";
      return res.redirect("/delivery/orders");
    }

    if (order.status !== "out_for_delivery") {
      req.session.error = "Only out for delivery orders can be completed with OTP";
      return res.redirect("/delivery/orders");
    }

    if (!otp || otp !== order.deliveryOtp) {
      req.session.error = "Invalid OTP. Please check the OTP with the customer.";
      return res.redirect("/delivery/orders");
    }

    order.status = "delivered";
    order.deliveryDate = new Date();
    order.deliveryOtpVerifiedAt = new Date();
    order.deliveryOtp = "";

    if (order.paymentStatus !== "failed") {
      order.paymentStatus = "completed";
    }

    await order.save();
    await recalculateDeliveredProductRating(order.productId);

    req.session.success = "Delivery completed successfully";
    return res.redirect("/delivery/orders");
  } catch (err) {
    console.log("Error completing delivery order:", err);
    req.session.error = "Could not complete the delivery";
    return res.redirect("/delivery/orders");
  }
};
