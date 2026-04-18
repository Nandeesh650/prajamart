const express = require("express");
const hostRouter = express.Router();

// Import the new multer config
const upload = require("../middleware/multer-config"); 

const hostController = require("../controllers/hostController");
const orderController = require("../controllers/orderController");

// --- GET ROUTES ---
hostRouter.get("/add-product", hostController.getAddProduct);
hostRouter.get("/host-product-list", hostController.getHostProducts);

// Line 13 is likely here - Ensure getEditProduct exists in hostController.js!
hostRouter.get("/edit-product/:productId", hostController.getEditProduct); 

hostRouter.get("/orders", orderController.getHostOrders);

// --- POST ROUTES ---
hostRouter.post("/add-product", upload.array("photos", 4), hostController.postAddProduct);
hostRouter.post("/edit-product", upload.array("photos", 4), hostController.postEditProduct);

hostRouter.post("/delete-product/:productId", hostController.postDeleteProduct);
hostRouter.post("/orders/:orderId/status", orderController.postUpdateOrderStatus);
hostRouter.post("/orders/:orderId/delete", orderController.postDeleteOrder);

module.exports = hostRouter;