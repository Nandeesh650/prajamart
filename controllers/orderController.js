const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const { buildDeliveryLocation } = require("../utils/locationData");

// ---------------- POPULATE QUERY ----------------
const populateOrderQuery = (query) =>
  query
    .populate({ path: "items.productId", strictPopulate: false }) // Fixed nested populate
    .populate("hostId", "firstName lastName email phoneNumber")
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("deliveryBoyId", "firstName lastName email phoneNumber");

// ---------------- RECALCULATE PRODUCT RATINGS ----------------
const recalculateDeliveredProductRating = async (productId) => {
  const deliveredOrders = await Order.find({
    "items.productId": productId,
    status: "delivered"
  }).select("items.userRating");

  let totalStars = 0;
  let ratingCount = 0;

  deliveredOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.productId.toString() === productId.toString() && (item.userRating?.stars || 0) > 0) {
        totalStars += item.userRating.stars;
        ratingCount += 1;
      }
    });
  });

  const averageRating = ratingCount > 0 ? Number((totalStars / ratingCount).toFixed(1)) : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: { stars: averageRating, count: ratingCount }
  });
};

// ---------------- HELPERS ----------------
const getParticipantId = (participant) => (participant?._id ? participant._id.toString() : participant?.toString() || "");
const getViewerRole = (order, userId) => {
  const customerId = getParticipantId(order.userId);
  const hostId = getParticipantId(order.hostId);
  const deliveryBoyId = getParticipantId(order.deliveryBoyId);

  if (customerId === userId) return "customer";
  if (hostId === userId) return "host";
  if (deliveryBoyId === userId) return "deliveryboy";
  return "";
};
const getCurrentPageForRole = (viewerRole) => viewerRole === "host" ? "host-orders" : viewerRole === "deliveryboy" ? "delivery-orders" : "orders";

const loadAuthorizedOrder = async (req, orderId) => {
  const userId = req.session.user._id.toString();
  const order = await populateOrderQuery(Order.findById(orderId));
  if (!order) return { status: "not-found" };
  const viewerRole = getViewerRole(order, userId);
  if (!viewerRole) return { status: "forbidden" };
  return { status: "ok", order, viewerRole };
};

// ---------------- GET ORDERS ----------------
exports.getCustomerOrders = (req, res, next) => {
  const userId = req.session.user._id;
  const success = req.session.success;
  const error = req.session.error;
  delete req.session.success;
  delete req.session.error;

  populateOrderQuery(Order.find({ userId }).sort({ orderDate: -1 }))
    .then(orders => {
      res.render("store/customer-orders", {
        orders,
        pageTitle: "My Orders",
        currentPage: "orders",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        success,
        error
      });
    })
    .catch(err => next(err));
};

exports.getHostOrders = (req, res, next) => {
  const hostId = req.session.user._id;
  const success = req.session.success;
  const error = req.session.error;
  delete req.session.success;
  delete req.session.error;

  populateOrderQuery(Order.find({ hostId }).sort({ orderDate: -1 }))
    .then(orders => {
      res.render("host/host-orders", {
        orders,
        pageTitle: "My Orders",
        currentPage: "host-orders",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        success,
        error
      });
    })
    .catch(err => next(err));
};

// ---------------- CREATE ORDER ----------------
exports.postCreateOrder = async (req, res) => {
  try {
    let { items, addressLabel, addressDetails, deliveryLatitude, deliveryLongitude,
          deliveryPlaceName, deliveryFormattedAddress, deliveryCity, notes,
          ratingStars, ratingComment, paymentMethod, upiId, cardNumber, cardHolder, expiryDate } = req.body;

    if (!items) return res.status(400).send("No items provided for the order");
    if (!Array.isArray(items)) items = [items];
    if (items.length === 0) return res.status(400).send("No items provided for the order");

    const userId = req.session.user._id;
    const validPaymentMethods = ["cod", "upi", "debit_card"];
    const method = paymentMethod || "cod";

    if (!validPaymentMethods.includes(method)) return res.status(400).send("Invalid payment method selected");
    if (method === "upi" && !upiId) return res.status(400).send("UPI ID is required for UPI payment");
    if (method === "debit_card" && (!cardNumber || !cardHolder || !expiryDate)) 
      return res.status(400).send("All card details are required for debit card payment");

    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate("hostId");
    if (products.length !== productIds.length) return res.status(404).send("Some products were not found");

    let totalPrice = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (product.availableSizes?.length > 0 && !item.size) throw new Error(`Size is required for product: ${product._id}`);
      const qty = parseInt(item.quantity, 10) || 1;
      const subtotal = product.price * qty;
      totalPrice += subtotal;
      return { productId: product._id, size: item.size, quantity: qty, price: product.price, subtotal };
    });

    const hostId = products[0].hostId?._id;
    if (!hostId) return res.status(400).send("No host assigned for the products");

    const mappedDelivery = buildDeliveryLocation({ addressLabel, addressDetails, deliveryLatitude, deliveryLongitude, deliveryPlaceName, deliveryFormattedAddress, deliveryCity });
    if (!mappedDelivery) return res.status(400).send("Please select the delivery location from the map");

    const orderData = {
      userId,
      hostId,
      items: orderItems,
      totalPrice,
      userRating: { stars: Math.min(5, Math.max(0, parseInt(ratingStars, 10) || 0)), comment: ratingComment || "" },
      deliveryLocation: mappedDelivery.deliveryLocation,
      shippingAddress: mappedDelivery.shippingAddress,
      notes: notes || "",
      paymentMethod: method,
      paymentStatus: "pending"
    };

    if (method === "upi") orderData.upiId = upiId;
    if (method === "debit_card") orderData.cardDetails = { cardNumber: `**** **** **** ${cardNumber.slice(-4)}`, cardHolder, expiryDate };

    const order = new Order(orderData);
    await order.save();

    for (const item of orderItems) await recalculateDeliveredProductRating(item.productId);

    req.session.success = `Order placed successfully with ${method === "cod" ? "Cash on Delivery" : method === "upi" ? "UPI" : "Debit Card"}`;
    return res.redirect("/orders");
  } catch (err) {
    console.error("Error creating order:", err);
    return res.status(500).send(`Error creating order: ${err.message}`);
  }
};

// ---------------- ORDER DETAILS ----------------
exports.getOrderDetails = async (req, res, next) => {
  const orderId = req.params.orderId;
  try {
    const { status, order, viewerRole } = await loadAuthorizedOrder(req, orderId);
    if (status === "not-found") return res.status(404).render("404", { pageTitle: "Order Not Found", isLoggedIn: req.isLoggedIn, user: req.session.user });
    if (status === "forbidden") return res.status(403).send("Unauthorized");

    res.render("store/order-details", {
      order,
      viewerRole,
      showDeliveryOtp: viewerRole !== "deliveryboy" && ["shipped", "out_for_delivery"].includes(order.status) && Boolean(order.deliveryOtp),
      pageTitle: "Order Details",
      currentPage: getCurrentPageForRole(viewerRole),
      isLoggedIn: req.isLoggedIn,
      user: req.session.user
    });
  } catch (err) { next(err); }
};

// ---------------- ORDER TRACKING ----------------
exports.getOrderTracking = async (req, res, next) => {
  const orderId = req.params.orderId;
  try {
    const { status, order, viewerRole } = await loadAuthorizedOrder(req, orderId);
    if (status === "not-found") return res.status(404).render("404", { pageTitle: "Order Not Found", isLoggedIn: req.isLoggedIn, user: req.session.user });
    if (status === "forbidden") return res.status(403).send("Unauthorized");

    res.render("tracking", {
      order,
      viewerRole,
      pageTitle: "Order Tracking",
      currentPage: getCurrentPageForRole(viewerRole),
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      canShareLocation: viewerRole === "deliveryboy" && ["shipped", "out_for_delivery"].includes(order.status)
    });
  } catch (err) { next(err); }
};

// ---------------- HOST ORDER STATUS ----------------
exports.postUpdateOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const { status } = req.body;
  const hostId = req.session.user._id.toString();
  const allowedHostStatuses = ["pending", "confirmed", "ready_to_deliver", "cancelled", "returned"];

  try {
    const order = await Order.findById(orderId);
    if (!order) { req.session.error = "Order not found"; return res.redirect("/host/orders"); }
    if (order.hostId.toString() !== hostId) { req.session.error = "Unauthorized"; return res.redirect("/host/orders"); }
    if (!allowedHostStatuses.includes(status)) { req.session.error = "Invalid status"; return res.redirect("/host/orders"); }

    if (status === "returned" && order.status !== "return_requested") { req.session.error = "Only return-requested orders can be marked returned"; return res.redirect("/host/orders"); }
    if (status !== "returned" && ["shipped","out_for_delivery","delivered","return_requested","returned"].includes(order.status)) { req.session.error = "Order cannot be updated"; return res.redirect("/host/orders"); }
    if (status === "cancelled" && order.deliveryBoyId) { req.session.error = "Assigned delivery orders cannot be cancelled"; return res.redirect("/host/orders"); }

    if (status === "ready_to_deliver" && (!Number.isFinite(Number(order.deliveryLocation?.latitude)) || !Number.isFinite(Number(order.deliveryLocation?.longitude)))) {
      req.session.error = "Delivery location required before offering to delivery boys"; return res.redirect("/host/orders");
    }

    order.status = status;
    if (status === "ready_to_deliver") { order.deliveryBoyId = undefined; order.deliveryAcceptedAt = undefined; order.deliveryDate = undefined; order.deliveryOtp = ""; order.deliveryOtpGeneratedAt = undefined; order.deliveryOtpVerifiedAt = undefined; }
    if (status === "returned") order.returnedAt = new Date();

    await order.save();
    for (const item of order.items) await recalculateDeliveredProductRating(item.productId);

    req.session.success = "Order status updated successfully";
    return res.redirect("/host/orders");
  } catch (err) { console.log(err); req.session.error = "Error updating order status"; return res.redirect("/host/orders"); }
};

// ---------------- CUSTOMER RETURN ----------------
exports.postRequestReturn = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.session.user._id.toString();

  try {
    const order = await Order.findById(orderId);
    if (!order) { req.session.error = "Order not found"; return res.redirect("/orders"); }
    if (order.userId.toString() !== userId) { req.session.error = "Unauthorized"; return res.redirect("/orders"); }
    if (order.status === "return_requested") { req.session.error = "Return already requested"; return res.redirect("/orders"); }
    if (order.status === "returned") { req.session.error = "Order already returned"; return res.redirect("/orders"); }
    if (order.status !== "delivered") { req.session.error = "Only delivered orders can be returned"; return res.redirect("/orders"); }

    order.status = "return_requested";
    order.returnRequestedAt = new Date();
    await order.save();

    for (const item of order.items) await recalculateDeliveredProductRating(item.productId);

    req.session.success = "Return request sent successfully";
    return res.redirect("/orders");
  } catch (err) { console.log(err); req.session.error = "Error requesting return"; return res.redirect("/orders"); }
};

// ---------------- CUSTOMER CANCEL ----------------
exports.postCancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.session.user._id.toString();

  try {
    const order = await Order.findById(orderId);
    if (!order) { req.session.error = "Order not found"; return res.redirect("/orders"); }
    if (order.userId.toString() !== userId) { req.session.error = "Unauthorized"; return res.redirect("/orders"); }
    if (!["pending","confirmed","ready_to_deliver"].includes(order.status)) { req.session.error = "Cannot cancel"; return res.redirect("/orders"); }

    order.status = "cancelled";
    order.deliveryBoyId = undefined; order.deliveryAcceptedAt = undefined; order.deliveryOtp = ""; order.deliveryOtpGeneratedAt = undefined; order.deliveryOtpVerifiedAt = undefined;
    await order.save();

    req.session.success = "Order cancelled successfully";
    return res.redirect("/orders");
  } catch (err) { console.log(err); req.session.error = "Error cancelling order"; return res.redirect("/orders"); }
};

// ---------------- HOST DELETE ----------------
exports.postDeleteOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const hostId = req.session.user._id.toString();

  try {
    const order = await Order.findById(orderId);
    if (!order) { req.session.error = "Order not found"; return res.redirect("/host/orders"); }
    if (order.hostId.toString() !== hostId) { req.session.error = "Unauthorized"; return res.redirect("/host/orders"); }

    await Order.findByIdAndDelete(orderId);
    req.session.success = "Order deleted successfully";
    return res.redirect("/host/orders");
  } catch (err) { console.log(err); req.session.error = "Error deleting order"; return res.redirect("/host/orders"); }
};
