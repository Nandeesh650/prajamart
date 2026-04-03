const express = require("express");
const orderRouter = express.Router();

const orderController = require("../controllers/orderController");

// Customer routes
orderRouter.get("/", orderController.getCustomerOrders);
orderRouter.get("/:orderId/tracking", orderController.getOrderTracking);
orderRouter.get("/:orderId", orderController.getOrderDetails);
orderRouter.post("/create", orderController.postCreateOrder);
orderRouter.post("/:orderId/cancel", orderController.postCancelOrder);
orderRouter.post("/:orderId/return", orderController.postRequestReturn);

module.exports = orderRouter;
