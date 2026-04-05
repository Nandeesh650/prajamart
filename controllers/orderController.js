const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const { buildDeliveryLocation } = require("../utils/locationData");

// ---------------- POPULATE QUERY ----------------
const populateOrderQuery = (query) =>
  query
    .populate({
      path: "items.productId",
      strictPopulate: false
    })
    .populate("hostId", "firstName lastName email phoneNumber")
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("deliveryBoyId", "firstName lastName email phoneNumber");

// ---------------- PRODUCT RATING ----------------
const recalculateDeliveredProductRating = async (productId) => {
  const deliveredOrders = await Order.find({
    "items.productId": productId,
    status: "delivered"
  });

  let totalStars = 0;
  let ratingCount = 0;

  deliveredOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (
        item.productId &&
        item.productId.toString() === productId.toString() &&
        item.userRating?.stars > 0
      ) {
        totalStars += item.userRating.stars;
        ratingCount++;
      }
    });
  });

  const averageRating =
    ratingCount > 0
      ? Number((totalStars / ratingCount).toFixed(1))
      : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: {
      stars: averageRating,
      count: ratingCount
    }
  });
};

// ---------------- HELPERS ----------------
const getParticipantId = (participant) =>
  participant?._id
    ? participant._id.toString()
    : participant?.toString() || "";

const getViewerRole = (order, userId) => {
  const customerId = getParticipantId(order.userId);
  const hostId = getParticipantId(order.hostId);
  const deliveryBoyId = getParticipantId(order.deliveryBoyId);

  if (customerId === userId) return "customer";
  if (hostId === userId) return "host";
  if (deliveryBoyId === userId) return "deliveryboy";

  return "";
};

const getCurrentPageForRole = (role) => {
  if (role === "host") return "host-orders";
  if (role === "deliveryboy") return "delivery-orders";
  return "orders";
};

const loadAuthorizedOrder = async (req, orderId) => {
  const userId = req.session.user._id.toString();

  const order = await populateOrderQuery(
    Order.findById(orderId)
  );

  if (!order) return { status: "not-found" };

  const viewerRole = getViewerRole(order, userId);

  if (!viewerRole) return { status: "forbidden" };

  return {
    status: "ok",
    order,
    viewerRole
  };
};

// ---------------- CUSTOMER ORDERS ----------------
exports.getCustomerOrders = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const success = req.session.success;
    const error = req.session.error;
    delete req.session.success;
    delete req.session.error;

    const orders = await populateOrderQuery(
      Order.find({ userId }).sort({ orderDate: -1 })
    );

    res.render("store/customer-orders", {
      orders,
      pageTitle: "My Orders",
      currentPage: "orders",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      success,
      error
    });
  } catch (err) {
    next(err);
  }
};

// ---------------- HOST ORDERS ----------------
exports.getHostOrders = async (req, res, next) => {
  try {
    const hostId = req.session.user._id;
    const success = req.session.success;
    const error = req.session.error;
    delete req.session.success;
    delete req.session.error;

    const orders = await populateOrderQuery(
      Order.find({ hostId }).sort({ orderDate: -1 })
    );

    res.render("host/host-orders", {
      orders,
      pageTitle: "Host Orders",
      currentPage: "host-orders",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      success,
      error
    });
  } catch (err) {
    next(err);
  }
};

// ---------------- CREATE ORDER ----------------
exports.postCreateOrder = async (req, res) => {
  try {
    let { items, addressLabel, addressDetails, deliveryLatitude, deliveryLongitude, deliveryPlaceName, deliveryFormattedAddress, deliveryCity, notes, paymentMethod, upiId, cardNumber, cardHolder, expiryDate } = req.body;

    if (!items) return res.status(400).send("No items provided");
    if (!Array.isArray(items)) items = [items];

    const userId = req.session.user._id;
    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate("hostId");

    let totalPrice = 0;
    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) throw new Error("Product not found");
      const quantity = parseInt(item.quantity, 10) || 1;
      const subtotal = product.price * quantity;
      totalPrice += subtotal;

      return {
        productId: product._id,
        size: item.size || "",
        quantity,
        price: product.price,
        subtotal
      };
    });

    const hostId = products[0].hostId._id;
    const mappedDelivery = buildDeliveryLocation({ addressLabel, addressDetails, deliveryLatitude, deliveryLongitude, deliveryPlaceName, deliveryFormattedAddress, deliveryCity });

    const order = new Order({
      userId, hostId, items: orderItems, totalPrice,
      deliveryLocation: mappedDelivery.deliveryLocation,
      shippingAddress: mappedDelivery.shippingAddress,
      notes: notes || "",
      paymentMethod: paymentMethod || "cod",
      paymentStatus: "pending",
      upiId,
      cardDetails: paymentMethod === "debit_card" ? { cardNumber: `**** **** **** ${cardNumber.slice(-4)}`, cardHolder, expiryDate } : undefined
    });

    await order.save();
    req.session.success = "Order placed successfully";
    res.redirect("/orders");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// ---------------- ORDER DETAILS ----------------
exports.getOrderDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const result = await loadAuthorizedOrder(req, orderId);

    if (result.status === "not-found") return res.status(404).send("Order not found");
    if (result.status === "forbidden") return res.status(403).send("Unauthorized");

    const { order, viewerRole } = result;

    // FIX: Define showDeliveryOtp for order-details.ejs
    const showDeliveryOtp = viewerRole === "customer" && ["shipped", "out_for_delivery"].includes(order.status);

    res.render("store/order-details", {
      order,
      viewerRole,
      showDeliveryOtp, // Passed to fix ReferenceError
      pageTitle: "Order Details",
      currentPage: getCurrentPageForRole(viewerRole),
      isLoggedIn: req.isLoggedIn,
      user: req.session.user
    });
  } catch (err) {
    next(err);
  }
};

// ---------------- ORDER TRACKING ----------------
exports.getOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const result = await loadAuthorizedOrder(req, orderId);

    if (result.status === "not-found") return res.status(404).send("Order not found");
    if (result.status === "forbidden") return res.status(403).send("Unauthorized");

    const { order, viewerRole } = result;

    // FIX: Define canShareLocation for tracking.ejs
    const canShareLocation = (viewerRole === "deliveryboy" || viewerRole === "host");

    res.render("tracking", {
      order,
      viewerRole,
      canShareLocation, // Passed to fix ReferenceError
      pageTitle: "Order Tracking",
      currentPage: getCurrentPageForRole(viewerRole),
      isLoggedIn: req.isLoggedIn,
      user: req.session.user
    });
  } catch (err) {
    next(err);
  }
};

// ---------------- RETURN REQUEST ----------------
exports.postRequestReturn = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.user._id.toString();
    const order = await Order.findById(orderId);

    if (!order || order.userId.toString() !== userId) {
      req.session.error = "Order not found or unauthorized";
      return res.redirect("/orders");
    }

    if (order.status !== "delivered") {
      req.session.error = "Only delivered orders can be returned";
      return res.redirect("/orders");
    }

    order.status = "return_requested";
    order.returnRequestedAt = new Date();
    await order.save();

    req.session.success = "Return request sent successfully";
    res.redirect("/orders");
  } catch (err) {
    req.session.error = "Error requesting return";
    res.redirect("/orders");
  }
};

// ---------------- CANCEL ORDER ----------------
exports.postCancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.user._id.toString();
    const order = await Order.findById(orderId);

    if (!order || order.userId.toString() !== userId) {
      req.session.error = "Unauthorized";
      return res.redirect("/orders");
    }

    order.status = "cancelled";
    await order.save();
    req.session.success = "Order cancelled";
    res.redirect("/orders");
  } catch (err) {
    req.session.error = "Error cancelling order";
    res.redirect("/orders");
  }
};

// ---------------- DELETE ORDER ----------------
exports.postDeleteOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const hostId = req.session.user._id.toString();
    const order = await Order.findById(orderId);

    if (!order || order.hostId.toString() !== hostId) {
      req.session.error = "Unauthorized";
      return res.redirect("/host/orders");
    }

    await Order.findByIdAndDelete(orderId);
    req.session.success = "Order deleted";
    res.redirect("/host/orders");
  } catch (err) {
    req.session.error = "Error deleting order";
    res.redirect("/host/orders");
  }
};

// ---------------- HOST STATUS UPDATE ----------------
exports.postUpdateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;
    const hostId = req.session.user._id.toString();

    const order = await Order.findById(orderId);

    if (!order || order.hostId.toString() !== hostId) {
      req.session.error = "Unauthorized";
      return res.redirect("/host/orders");
    }

    order.status = status;

    // Trigger rating recalculation if marked delivered
    if (status === 'delivered') {
        for (const item of order.items) {
            await recalculateDeliveredProductRating(item.productId);
        }
    }

    await order.save();
    req.session.success = `Order marked as ${status.replace('_', ' ')}`;
    res.redirect("/host/orders");
  } catch (err) {
    req.session.error = "Error updating order";
    res.redirect("/host/orders");
  }
};