const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");

// Get all orders for a customer
exports.getCustomerOrders = (req, res, next) => {
  const userId = req.session.user._id;
  const success = req.session.success;
  const error = req.session.error;
  delete req.session.success;
  delete req.session.error;

  Order.find({ userId })
    .populate('productId')
    .populate('hostId', 'firstName lastName email')
    .sort({ orderDate: -1 })
    .then((orders) => {
      res.render("store/customer-orders", {
        orders: orders,
        pageTitle: "My Orders",
        currentPage: "orders",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        success: success,
        error: error,
      });
    })
    .catch((err) => {
      console.log("Error fetching orders: ", err);
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

  Order.find({ hostId })
    .populate('productId')
    .populate('userId', 'firstName lastName email')
    .sort({ orderDate: -1 })
    .then((orders) => {
      res.render("host/host-orders", {
        orders: orders,
        pageTitle: "My Orders",
        currentPage: "host-orders",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        success: success,
        error: error,
      });
    })
    .catch((err) => {
      console.log("Error fetching host orders: ", err);
      next(err);
    });
};

// Create a new order from a product
exports.postCreateOrder = async (req, res, next) => {
  try {
    const { productId, quantity, shippingAddress, notes, ratingStars, ratingComment, paymentMethod, upiId, cardNumber, cardHolder, expiryDate } = req.body;
    const userId = req.session.user._id;

    console.log("Order Request:", { productId, quantity, shippingAddress, userId, ratingStars, paymentMethod });

    // Validate payment method
    const validPaymentMethods = ['cod', 'upi', 'debit_card'];
    const method = paymentMethod || 'cod';
    
    if (!validPaymentMethods.includes(method)) {
      return res.status(400).send("Invalid payment method selected");
    }

    // Validate payment details based on method
    if (method === 'upi' && !upiId) {
      return res.status(400).send("UPI ID is required for UPI payment");
    }

    if (method === 'debit_card' && (!cardNumber || !cardHolder || !expiryDate)) {
      return res.status(400).send("All card details are required for debit card payment");
    }

    // Get product details
    const product = await Product.findById(productId).populate('hostId');
    if (!product) {
      console.log("Product not found:", productId);
      return res.status(404).send("Product not found");
    }

    console.log("Product found:", { productName: product.productName, hostId: product.hostId });

    // Get hostId from product
    let hostId = product.hostId;
    
    if (!hostId) {
      console.log("Product has no hostId, trying to assign...");
      // If product has no hostId, assign it to the first available host
      const host = await User.findOne({ userType: 'host' });
      
      if (!host) {
        console.log("No host found in system");
        return res.status(400).send("No seller available for this product. Please contact support.");
      }
      
      hostId = host._id;
      product.hostId = host._id;
      await product.save();
      console.log("Product updated with hostId:", hostId);
    }

    // Validate quantity
    const qty = parseInt(quantity) || 1;
    if (qty <= 0) {
      return res.status(400).send("Invalid quantity");
    }

    // Calculate total price
    const totalPrice = product.price * qty;

    // Validate and process rating
    const ratingValue = Math.min(5, Math.max(0, parseInt(ratingStars) || 0));

    // Create new order object with payment information
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
      shippingAddress: shippingAddress || "Not provided",
      notes: notes || "",
      paymentMethod: method,
      paymentStatus: method === 'cod' ? 'pending' : 'pending'
    };

    // Add payment-specific details
    if (method === 'upi') {
      orderData.upiId = upiId;
      orderData.paymentStatus = 'pending'; // In real app, would integrate with UPI API
    } else if (method === 'debit_card') {
      // Store only last 4 digits for security (mask card number)
      orderData.cardDetails = {
        cardNumber: '**** **** **** ' + cardNumber.slice(-4),
        cardHolder: cardHolder,
        expiryDate: expiryDate
      };
      orderData.paymentStatus = 'pending'; // In real app, would integrate with payment gateway
    }

    const order = new Order(orderData);

    await order.save();
    console.log("Order created successfully:", order._id);

    // Update product rating
    const allOrders = await Order.find({ productId });
    const totalStars = allOrders.reduce((sum, o) => sum + (o.userRating?.stars || 0), 0);
    const ratingCount = allOrders.filter(o => o.userRating?.stars > 0).length;
    const avgRating = ratingCount > 0 ? (totalStars / ratingCount).toFixed(1) : 0;

    product.rating = {
      stars: parseFloat(avgRating),
      count: ratingCount
    };
    await product.save();

    console.log("Product rating updated:", product.rating);
    req.session.success = `Order placed successfully with ${method === 'cod' ? 'Cash on Delivery' : method === 'upi' ? 'UPI' : 'Debit Card'}`;
    res.redirect("/orders");
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).send("Error creating order: " + err.message);
  }
};

// Get order details
exports.getOrderDetails = (req, res, next) => {
  const orderId = req.params.orderId;
  const userId = req.session.user._id;

  Order.findById(orderId)
    .populate('productId')
    .populate('hostId', 'firstName lastName email')
    .populate('userId', 'firstName lastName email')
    .then((order) => {
      if (!order) {
        return res.status(404).render("404", {
          pageTitle: "Order Not Found",
          isLoggedIn: req.isLoggedIn,
          user: req.session.user,
        });
      }

      // Check if user is authorized to view this order
      if (order.userId.toString() !== userId.toString() && order.hostId.toString() !== userId.toString()) {
        return res.status(403).send("Unauthorized");
      }

      res.render("store/order-details", {
        order: order,
        pageTitle: "Order Details",
        currentPage: "orders",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    })
    .catch((err) => {
      console.log("Error fetching order details: ", err);
      next(err);
    });
};

// Update order status (for hosts)
exports.postUpdateOrderStatus = (req, res, next) => {
  const orderId = req.params.orderId;
  const { status } = req.body;
  const hostId = req.session.user._id;

  Order.findById(orderId).then((order) => {
    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/host/orders");
    }

    // Check if user is the host
    if (order.hostId.toString() !== hostId.toString()) {
      req.session.error = "Unauthorized: You cannot update this order";
      return res.redirect("/host/orders");
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveryDate = new Date();
    }

    order.save().then(() => {
      console.log("Order status updated successfully");
      req.session.success = "Order status updated successfully";
      res.redirect("/host/orders");
    }).catch((err) => {
      console.log("Error updating order status: ", err);
      req.session.error = "Error updating order status";
      res.redirect("/host/orders");
    });
  }).catch((err) => {
    console.log("Error finding order: ", err);
    req.session.error = "Error finding order";
    res.redirect("/host/orders");
  });
};

// Cancel order (for customers)
exports.postCancelOrder = (req, res, next) => {
  const orderId = req.params.orderId;
  const userId = req.session.user._id;

  Order.findById(orderId).then((order) => {
    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/orders");
    }

    if (order.userId.toString() !== userId.toString()) {
      req.session.error = "Unauthorized: You cannot cancel this order";
      return res.redirect("/orders");
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      req.session.error = "Order cannot be cancelled at this stage";
      return res.redirect("/orders");
    }

    order.status = 'cancelled';
    order.save().then(() => {
      console.log("Order cancelled");
      req.session.success = "Order cancelled successfully";
      res.redirect("/orders");
    }).catch((err) => {
      console.log("Error cancelling order: ", err);
      req.session.error = "Error cancelling order";
      res.redirect("/orders");
    });
  }).catch((err) => {
    console.log("Error finding order: ", err);
    req.session.error = "Error finding order";
    res.redirect("/orders");
  });
};

// Delete order (for hosts)
exports.postDeleteOrder = (req, res, next) => {
  const orderId = req.params.orderId;
  const hostId = req.session.user._id;

  Order.findById(orderId).then((order) => {
    if (!order) {
      req.session.error = "Order not found";
      return res.redirect("/host/orders");
    }

    // Check if user is the host
    if (order.hostId.toString() !== hostId.toString()) {
      req.session.error = "Unauthorized: You cannot delete this order";
      return res.redirect("/host/orders");
    }

    // Delete the order
    Order.findByIdAndDelete(orderId).then(() => {
      console.log("Order deleted successfully");
      req.session.success = "Order deleted successfully";
      res.redirect("/host/orders");
    }).catch((err) => {
      console.log("Error deleting order: ", err);
      req.session.error = "Error deleting order";
      res.redirect("/host/orders");
    });
  }).catch((err) => {
    console.log("Error finding order: ", err);
    req.session.error = "Error finding order";
    res.redirect("/host/orders");
  });
};
