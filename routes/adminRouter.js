const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controllers/adminController");
const upload = require("../middleware/multer");

// Admin Authentication
adminRouter.get("/login", adminController.getAdminLogin);
adminRouter.post("/login", adminController.postAdminLogin);
adminRouter.post("/logout", adminController.postAdminLogout);
adminRouter.get("/create-first-admin", adminController.createFirstAdmin);

// Admin Dashboard
adminRouter.get("/dashboard", adminController.getAdminDashboard);
adminRouter.post("/update-product-poster", upload.single("poster"), adminController.postUpdateProductPoster);
adminRouter.post("/delete-order/:orderId", adminController.postAdminDeleteOrder);
adminRouter.post("/update-status/:orderId", adminController.postAdminUpdateStatus);

// Post Management
adminRouter.get("/posts", adminController.getAllPosts);
adminRouter.get("/posts/add", adminController.getAddPost);
adminRouter.post("/posts/add", upload.single('imageUrl'), adminController.postAddPost);
adminRouter.get("/posts/:postId/edit", adminController.getEditPost);
adminRouter.post("/posts/:postId/edit", upload.single('imageUrl'), adminController.postEditPost);
adminRouter.post("/posts/:postId/delete", adminController.postDeletePost);

// User Management
adminRouter.get("/users", adminController.getAllUsers);
adminRouter.get("/users/:userId/edit", adminController.getEditUser);
adminRouter.post("/users/:userId/edit", adminController.postEditUser);
adminRouter.post("/users/:userId/delete", adminController.postDeleteUser);

module.exports = adminRouter;
