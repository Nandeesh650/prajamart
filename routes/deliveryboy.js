const express = require("express");
const deliveryRouter = express.Router();

const deliveryboyController = require("../controllers/deliveryboyController");

deliveryRouter.get("/orders", deliveryboyController.getDeliveryOrders);
deliveryRouter.post("/orders/:orderId/accept", deliveryboyController.postAcceptDelivery);
deliveryRouter.post("/orders/:orderId/start", deliveryboyController.postStartOutForDelivery);
deliveryRouter.post("/orders/:orderId/complete", deliveryboyController.postCompleteDelivery);

module.exports = deliveryRouter;
