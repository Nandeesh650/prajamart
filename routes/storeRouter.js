// External Module
const express = require("express");
const storeRouter = express.Router();

// Local Module
const storeController = require("../controllers/storeController");

storeRouter.get("/", storeController.getIndex);
storeRouter.get("/products", storeController.getProducts);
storeRouter.get("/bookings", storeController.getBookings);
storeRouter.get("/cart", storeController.getCartList);
storeRouter.get("/search", storeController.getSearch);

storeRouter.get("/products/:productId", storeController.getProductDetails);
storeRouter.post("/cart", storeController.postAddToCart);
storeRouter.post("/cart/delete/:productId", storeController.postRemoveFromCart);
module.exports = storeRouter;
