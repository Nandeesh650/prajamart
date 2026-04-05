const Order = require("../models/order");
const Product = require("../models/product");
const { calculateDistanceKm } = require("../utils/locationData");

// ================= POPULATE =================
const populateDeliveryOrders = (query) =>
  query
    .populate("items.productId")
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("hostId", "firstName lastName email phoneNumber")
    .populate("deliveryBoyId", "firstName lastName email phoneNumber");

// ================= HELPERS =================
const createDeliveryOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// ================= UPDATE PRODUCT RATING =================
const recalculateDeliveredProductRating = async (productId) => {
  const deliveredOrders = await Order.find({
    "items.productId": productId,
    status: "delivered",
  });

  const ratings = [];

  deliveredOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (
        String(item.productId) === String(productId) &&
        item.userRating?.stars > 0
      ) {
        ratings.push(item.userRating.stars);
      }
    });
  });

  const count = ratings.length;

  const avg =
    count > 0
      ? Number(
          (
            ratings.reduce((sum, star) => sum + star, 0) / count
          ).toFixed(1)
        )
      : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: {
      stars: avg,
      count,
    },
  });
};

// ================= DELIVERY DASHBOARD =================
exports.getDeliveryOrders = async (req, res, next) => {
  try {
    const deliveryBoyId = req.session.user._id;

    const success = req.session.success;
    const error = req.session.error;

    delete req.session.success;
    delete req.session.error;

    const userLat = Number(req.query.latitude);
    const userLng = Number(req.query.longitude);

    const [
      allAvailableOrders,
      activeOrders,
      completedOrders,
    ] = await Promise.all([
      populateDeliveryOrders(
        Order.find({
          status: "ready_to_deliver",
          $or: [
            { deliveryBoyId: { $exists: false } },
            { deliveryBoyId: null },
          ],
        })
          .sort({ orderDate: 1 })
          .limit(30)
      ),

      populateDeliveryOrders(
        Order.find({
          deliveryBoyId,
          status: {
            $in: ["shipped", "out_for_delivery"],
          },
        })
          .sort({
            deliveryAcceptedAt: -1,
            orderDate: -1,
          })
          .limit(30)
      ),

      populateDeliveryOrders(
        Order.find({
          deliveryBoyId,
          status: "delivered",
        })
          .sort({
            deliveryDate: -1,
          })
          .limit(30)
      ),
    ]);

    let availableOrders = [];

    if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
      availableOrders = allAvailableOrders.filter((order) => {
        if (
          !order.deliveryLocation?.latitude ||
          !order.deliveryLocation?.longitude
        ) {
          return false;
        }

        const distance = calculateDistanceKm(
          {
            latitude: userLat,
            longitude: userLng,
          },
          {
            latitude: order.deliveryLocation.latitude,
            longitude: order.deliveryLocation.longitude,
          }
        );

        return distance <= 20;
      });
    } else {
      availableOrders = allAvailableOrders;
    }

    res.render("delivery/orders", {
      availableOrders,
      activeOrders,
      completedOrders,
      pageTitle: "Delivery Dashboard",
      currentPage: "delivery-orders",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      success,
      error,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    next(err);
  }
};

// ================= ACCEPT DELIVERY =================
exports.postAcceptDelivery = async (req, res) => {
  try {
    const deliveryBoyId = req.session.user._id.toString();
    const orderId = req.params.orderId;

    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);

    const order = await Order.findById(orderId);

    if (!order) throw new Error("Order not found");

    if (order.status !== "ready_to_deliver") {
      throw new Error("Order not ready");
    }

    if (order.deliveryBoyId) {
      throw new Error("Already accepted");
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("Live location required");
    }

    const distanceKm = calculateDistanceKm(
      { latitude, longitude },
      order.deliveryLocation
    );

    if (distanceKm > 20) {
      throw new Error("Only 20 KM orders allowed");
    }

    order.deliveryBoyId = deliveryBoyId;
    order.deliveryAcceptedAt = new Date();
    order.deliveryOtp = createDeliveryOtp();
    order.deliveryOtpGeneratedAt = new Date();
    order.status = "shipped";

    await order.save();

    req.session.success = "Order accepted successfully";
    res.redirect("/delivery/orders");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/delivery/orders");
  }
};

// ================= START DELIVERY =================
exports.postStartOutForDelivery = async (req, res) => {
  try {
    const deliveryBoyId = req.session.user._id.toString();
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);

    if (!order) throw new Error("Order not found");

    if (String(order.deliveryBoyId) !== deliveryBoyId) {
      throw new Error("Unauthorized");
    }

    if (order.status !== "shipped") {
      throw new Error("Invalid status");
    }

    order.status = "out_for_delivery";

    await order.save();

    req.session.success = "Order out for delivery";
    res.redirect("/delivery/orders");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/delivery/orders");
  }
};

// ================= COMPLETE DELIVERY =================
exports.postCompleteDelivery = async (req, res) => {
  try {
    const deliveryBoyId = req.session.user._id.toString();
    const orderId = req.params.orderId;
    const otp = String(req.body.otp || "").trim();

    const order = await Order.findById(orderId);

    if (!order) throw new Error("Order not found");

    if (String(order.deliveryBoyId) !== deliveryBoyId) {
      throw new Error("Unauthorized");
    }

    if (order.status !== "out_for_delivery") {
      throw new Error("Order not active");
    }

    if (!otp || otp !== order.deliveryOtp) {
      throw new Error("Invalid OTP");
    }

    order.status = "delivered";
    order.deliveryDate = new Date();
    order.deliveryOtpVerifiedAt = new Date();
    order.deliveryOtp = "";

    if (order.paymentStatus !== "failed") {
      order.paymentStatus = "completed";
    }

    await order.save();

    for (const item of order.items) {
      await recalculateDeliveredProductRating(item.productId);
    }

    req.session.success = "Delivery completed";
    res.redirect("/delivery/orders");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/delivery/orders");
  }
};
