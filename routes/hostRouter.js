// External Module
const express = require("express");
const hostRouter = express.Router();

// Local Module
const hostController = require("../controllers/hostController");
const orderController = require("../controllers/orderController");

hostRouter.get("/add-product", hostController.getAddProduct);
hostRouter.post("/add-product", hostController.postAddProduct);
hostRouter.get("/host-product-list", hostController.getHostProducts);
hostRouter.get("/edit-product/:productId", hostController.getEditProduct);
hostRouter.post("/edit-product", hostController.postEditProduct);
hostRouter.post("/delete-product/:productId", hostController.postDeleteProduct);
hostRouter.get("/orders", orderController.getHostOrders);
hostRouter.post("/orders/:orderId/status", orderController.postUpdateOrderStatus);
hostRouter.post("/orders/:orderId/delete", orderController.postDeleteOrder);

module.exports = hostRouter;
