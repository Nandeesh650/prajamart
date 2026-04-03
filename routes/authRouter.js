const express = require("express");

const authRouter = express.Router();
const authController = require("../controllers/authController");

const requireAuth = (req, res, next) => {
  if (!req.isLoggedIn || !req.session.user?._id) {
    return res.redirect("/login");
  }

  return next();
};

authRouter.get("/login", authController.getLogin);
authRouter.post("/login", authController.postLogin);
authRouter.post("/logout", authController.postLogout);

authRouter.get("/signup", authController.getSignup);
authRouter.post("/signup", authController.postSignup);

authRouter.get("/forgot-password", authController.getForgotPassword);
authRouter.post("/forgot-password", authController.postForgotPassword);
authRouter.get("/reset-password/:token", authController.getResetPassword);
authRouter.post("/reset-password", authController.postResetPassword);

authRouter.get("/profile", requireAuth, authController.getProfile);
authRouter.get("/profile/edit", requireAuth, authController.getEditProfile);
authRouter.post("/profile/edit", requireAuth, authController.postUpdateProfile);

module.exports = authRouter;
