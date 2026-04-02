const express = require("express");
const orderRouter = express.Router();

const orderController = require("../controllers/orderController");

// Customer routes
orderRouter.get("/", orderController.getCustomerOrders);
orderRouter.get("/:orderId", orderController.getOrderDetails);
orderRouter.post("/", orderController.postCreateOrder);
orderRouter.post("/:orderId/cancel", orderController.postCancelOrder);

module.exports = orderRouter;
