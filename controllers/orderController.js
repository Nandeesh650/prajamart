const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const { buildDeliveryLocation } = require("../utils/locationData");

const populateOrderQuery = (query) =>
  query
    .populate("productId")
    .populate("hostId", "firstName lastName email phoneNumber")
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("deliveryBoyId", "firstName lastName email phoneNumber");

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

const getParticipantId = (participant) => {
  if (!participant) {
    return "";
  }

  if (participant._id) {
    return participant._id.toString();
  }

  return participant.toString();
};

const getViewerRole = (order, userId) => {
  const customerId = getParticipantId(order.userId);
  const hostId = getParticipantId(order.hostId);
  const deliveryBoyId = getParticipantId(order.deliveryBoyId);

  if (customerId === userId) {
    return "customer";
  }

  if (hostId === userId) {
    return "host";
  }

  if (deliveryBoyId === userId) {
    return "deliveryboy";
  }

  return "";
};

const getCurrentPageForRole = (viewerRole) => {
  if (viewerRole === "host") {
    return "host-orders";
  }

  if (viewerRole === "deliveryboy") {
    return "delivery-orders";
  }

  return "orders";
};

const loadAuthorizedOrder = async (req, orderId) => {
  const userId = req.session.user._id.toString();
  const order = await populateOrderQuery(Order.findById(orderId));

  if (!order) {
    return { status: "not-found" };
  }

  const viewerRole = getViewerRole(order, userId);

  if (!viewerRole) {
    return { status: "forbidden" };
  }

  return { status: "ok", order, viewerRole };
};

// Get all orders for a customer
exports.getCustomerOrders = (req, res, next) => {
  const userId = req.session.user._id;
  const success = req.session.success;
  const error = req.session.error;

  delete req.session.success;
  delete req.session.error;

  populateOrderQuery(Order.find({ userId }).sort({ orderDate: -1 }))
    .then((orders) => {
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
    .catch((err) => {
      console.log("Error fetching orders:", err);
      next(err);
    });
};

// Get all orders for a host
exports.getHostOrders = (req, res, next) => {
  const hostId = req.session.user._id;
  const success = req.session.success;
  const error = req.session.error;

  delete req.session.success;
  delete req.session.error;

  populateOrderQuery(Order.find({ hostId }).sort({ orderDate: -1 }))
    .then((orders) => {
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
    .catch((err) => {
      console.log("Error fetching host orders:", err);
      next(err);
    });
};

// Create a new order from a product
exports.postCreateOrder = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      addressLabel,
      addressDetails,
      deliveryLatitude,
      deliveryLongitude,
      deliveryPlaceName,
      deliveryFormattedAddress,
      deliveryCity,
      notes,
      ratingStars,
      ratingComment,
      paymentMethod,
      upiId,
      cardNumber,
      cardHolder,
      expiryDate
    } = req.body;
    const userId = req.session.user._id;

    const validPaymentMethods = ["cod", "upi", "debit_card"];
    const method = paymentMethod || "cod";

    if (!validPaymentMethods.includes(method)) {
      return res.status(400).send("Invalid payment method selected");
    }

    if (method === "upi" && !upiId) {
      return res.status(400).send("UPI ID is required for UPI payment");
    }

    if (method === "debit_card" && (!cardNumber || !cardHolder || !expiryDate)) {
      return res.status(400).send("All card details are required for debit card payment");
    }

    const product = await Product.findById(productId).populate("hostId");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    let hostId = product.hostId;

    if (!hostId) {
      const host = await User.findOne({ userType: "host" });

      if (!host) {
        return res.status(400).send("No seller available for this product. Please contact support.");
      }

      hostId = host._id;
      product.hostId = host._id;
      await product.save();
    }

    const qty = parseInt(quantity, 10) || 1;

    if (qty <= 0) {
      return res.status(400).send("Invalid quantity");
    }

    const totalPrice = product.price * qty;
    const ratingValue = Math.min(5, Math.max(0, parseInt(ratingStars, 10) || 0));
    const mappedDelivery = buildDeliveryLocation({
      addressLabel,
      addressDetails,
      deliveryLatitude,
      deliveryLongitude,
      deliveryPlaceName,
      deliveryFormattedAddress,
      deliveryCity
    });

    if (!mappedDelivery) {
      return res.status(400).send("Please select the delivery location from the map");
    }

    const orderData = {
      userId,
      productId,
      hostId,
      quantity: qty,
      totalPrice,
      userRating: {
        stars: ratingValue,
        comment: ratingComment || ""
      },
      deliveryLocation: mappedDelivery.deliveryLocation,
      shippingAddress: mappedDelivery.shippingAddress,
      notes: notes || "",
      paymentMethod: method,
      paymentStatus: "pending"
    };

    if (method === "upi") {
      orderData.upiId = upiId;
    } else if (method === "debit_card") {
      orderData.cardDetails = {
        cardNumber: `**** **** **** ${cardNumber.slice(-4)}`,
        cardHolder,
        expiryDate
      };
    }

    const order = new Order(orderData);

    await order.save();

    await recalculateDeliveredProductRating(productId);

    req.session.success = `Order placed successfully with ${method === "cod" ? "Cash on Delivery" : method === "upi" ? "UPI" : "Debit Card"}`;
    return res.redirect("/orders");
  } catch (err) {
    console.error("Error creating order:", err);
    return res.status(500).send(`Error creating order: ${err.message}`);
  }
};

// Get order details
exports.getOrderDetails = (req, res, next) => {
  const orderId = req.params.orderId;

  loadAuthorizedOrder(req, orderId)
    .then(({ status, order, viewerRole }) => {
      if (status === "not-found") {
        return res.status(404).render("404", {
          pageTitle: "Order Not Found",
          isLoggedIn: req.isLoggedIn,
          user: req.session.user
        });
      }

      if (status === "forbidden") {
        return res.status(403).send("Unauthorized");
      }

      res.render("store/order-details", {
        order,
        viewerRole,
        showDeliveryOtp: viewerRole !== "deliveryboy" && ["shipped", "out_for_delivery"].includes(order.status) && Boolean(order.deliveryOtp),
        pageTitle: "Order Details",
        currentPage: getCurrentPageForRole(viewerRole),
        isLoggedIn: req.isLoggedIn,
        user: req.session.user
      });
    })
    .catch((err) => {
      console.log("Error fetching order details:", err);
      next(err);
    });
};

exports.getOrderTracking = (req, res, next) => {
  const orderId = req.params.orderId;

  loadAuthorizedOrder(req, orderId)
    .then(({ status, order, viewerRole }) => {
      if (status === "not-found") {
        return res.status(404).render("404", {
          pageTitle: "Order Not Found",
          isLoggedIn: req.isLoggedIn,
          user: req.session.user
        });
      }

      if (status === "forbidden") {
        return res.status(403).send("Unauthorized");
      }

      res.render("tracking", {
        order,
        viewerRole,
        pageTitle: "Order Tracking",
        currentPage: getCurrentPageForRole(viewerRole),
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        canShareLocation: viewerRole === "deliveryboy" && ["shipped", "out_for_delivery"].includes(order.status)
      });
    })
    .catch((err) => {
      console.log("Error loading order tracking:", err);
      next(err);
    });
};

// Update order status (for hosts)
exports.postUpdateOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const { status } = req.body;
  const hostId = req.session.user._id.toString();
  const allowedHostStatuses = ["pending", "confirmed", "ready_to_deliver", "cancelled", "returned"];

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/host/orders");
    }

    if (order.hostId.toString() !== hostId) {
      req.session.error = "Unauthorized: You cannot update this order";
      return res.redirect("/host/orders");
    }

    if (!allowedHostStatuses.includes(status)) {
      req.session.error = "Host can move orders only up to Ready to Deliver, or mark a return-requested order as returned";
      return res.redirect("/host/orders");
    }

    if (status === "returned" && order.status !== "return_requested") {
      req.session.error = "Only return requested orders can be marked as returned";
      return res.redirect("/host/orders");
    }

    if (status !== "returned" && ["shipped", "out_for_delivery", "delivered", "return_requested", "returned"].includes(order.status)) {
      req.session.error = "This order can no longer be updated from the host dashboard";
      return res.redirect("/host/orders");
    }

    if (status === "cancelled" && order.deliveryBoyId) {
      req.session.error = "Assigned delivery orders cannot be cancelled by the host";
      return res.redirect("/host/orders");
    }

    if (
      status === "ready_to_deliver" &&
      (
        !Number.isFinite(Number(order.deliveryLocation?.latitude)) ||
        !Number.isFinite(Number(order.deliveryLocation?.longitude))
      )
    ) {
      req.session.error = "This order needs a mapped delivery location before it can be offered to delivery boys";
      return res.redirect("/host/orders");
    }

    order.status = status;

    if (status === "ready_to_deliver") {
      order.deliveryBoyId = undefined;
      order.deliveryAcceptedAt = undefined;
      order.deliveryDate = undefined;
      order.deliveryOtp = "";
      order.deliveryOtpGeneratedAt = undefined;
      order.deliveryOtpVerifiedAt = undefined;
    }

    if (status === "returned") {
      order.returnedAt = new Date();
    }

    await order.save();
    await recalculateDeliveredProductRating(order.productId);

    req.session.success = status === "ready_to_deliver"
      ? "Order is ready to deliver and now visible to nearby delivery boys"
      : status === "returned"
        ? "Order marked as returned successfully"
        : "Order status updated successfully";
    return res.redirect("/host/orders");
  } catch (err) {
    console.log("Error updating order status:", err);
    req.session.error = "Error updating order status";
    return res.redirect("/host/orders");
  }
};

// Request return (for customers)
exports.postRequestReturn = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.session.user._id.toString();

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/orders");
    }

    if (order.userId.toString() !== userId) {
      req.session.error = "Unauthorized: You cannot return this order";
      return res.redirect("/orders");
    }

    if (order.status === "return_requested") {
      req.session.error = "Return has already been requested for this order";
      return res.redirect("/orders");
    }

    if (order.status === "returned") {
      req.session.error = "This order has already been returned";
      return res.redirect("/orders");
    }

    if (order.status !== "delivered") {
      req.session.error = "Only delivered orders can be returned";
      return res.redirect("/orders");
    }

    order.status = "return_requested";
    order.returnRequestedAt = new Date();

    await order.save();
    await recalculateDeliveredProductRating(order.productId);

    req.session.success = "Return request sent to the host successfully";
    return res.redirect("/orders");
  } catch (err) {
    console.log("Error requesting order return:", err);
    req.session.error = "Error requesting product return";
    return res.redirect("/orders");
  }
};

// Cancel order (for customers)
exports.postCancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.session.user._id.toString();

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/orders");
    }

    if (order.userId.toString() !== userId) {
      req.session.error = "Unauthorized: You cannot cancel this order";
      return res.redirect("/orders");
    }

    if (!["pending", "confirmed", "ready_to_deliver"].includes(order.status)) {
      req.session.error = "Order cannot be cancelled at this stage";
      return res.redirect("/orders");
    }

    order.status = "cancelled";
    order.deliveryBoyId = undefined;
    order.deliveryAcceptedAt = undefined;
    order.deliveryOtp = "";
    order.deliveryOtpGeneratedAt = undefined;
    order.deliveryOtpVerifiedAt = undefined;

    await order.save();

    req.session.success = "Order cancelled successfully";
    return res.redirect("/orders");
  } catch (err) {
    console.log("Error cancelling order:", err);
    req.session.error = "Error cancelling order";
    return res.redirect("/orders");
  }
};

// Delete order (for hosts)
exports.postDeleteOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const hostId = req.session.user._id.toString();

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/host/orders");
    }

    if (order.hostId.toString() !== hostId) {
      req.session.error = "Unauthorized: You cannot delete this order";
      return res.redirect("/host/orders");
    }

    await Order.findByIdAndDelete(orderId);

    req.session.success = "Order deleted successfully";
    return res.redirect("/host/orders");
  } catch (err) {
    console.log("Error deleting order:", err);
    req.session.error = "Error deleting order";
    return res.redirect("/host/orders");
  }
};
