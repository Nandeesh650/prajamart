const crypto = require("crypto");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const User = require("../models/user");

const passwordValidator = check("password")
  .trim()
  .isLength({ min: 8 })
  .withMessage("Password should be atleast 8 characters long")
  .matches(/[A-Z]/)
  .withMessage("Password should contain atleast one uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password should contain atleast one lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Password should contain atleast one number")
  .matches(/[!@&]/)
  .withMessage("Password should contain atleast one special character");

const signupValidators = [
  check("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name should be atleast 2 characters long")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("First Name should contain only alphabets"),
  check("lastName")
    .trim()
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("Last Name should contain only alphabets"),
  check("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail()
    .custom(async (value) => {
      const existingUser = await User.findOne({ email: value });

      if (existingUser) {
        throw new Error("An account with this email already exists");
      }

      return true;
    }),
  check("phoneNumber")
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Please enter a valid 10 digit phone number"),
  passwordValidator,
  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),
  check("userType")
    .notEmpty()
    .withMessage("Please select a user type")
    .isIn(["guest", "host", "deliveryboy"])
    .withMessage("Invalid user type"),
  check("terms")
    .notEmpty()
    .withMessage("Please accept the terms and conditions")
    .custom((value) => {
      if (value !== "on") {
        throw new Error("Please accept the terms and conditions");
      }

      return true;
    })
];

const profileValidators = [
  check("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name should be atleast 2 characters long")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("First Name should contain only alphabets"),
  check("lastName")
    .trim()
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("Last Name should contain only alphabets"),
  check("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const existingUser = await User.findOne({
        email: value,
        _id: { $ne: req.session.user?._id }
      });

      if (existingUser) {
        throw new Error("Another account already uses this email");
      }

      return true;
    }),
  check("phoneNumber")
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Please enter a valid 10 digit phone number")
];

const resetPasswordValidators = [
  passwordValidator,
  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    })
];

const consumeFlashMessages = (req) => {
  const success = req.session.success || "";
  const error = req.session.error || "";

  delete req.session.success;
  delete req.session.error;

  return { success, error };
};

const renderLogin = (res, options = {}) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
    errors: options.errors || [],
    success: options.success || "",
    error: options.error || "",
    oldInput: {
      email: options.oldInput?.email || ""
    },
    user: {}
  });
};

const renderSignup = (res, options = {}) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currentPage: "signup",
    isLoggedIn: false,
    errors: options.errors || [],
    success: options.success || "",
    error: options.error || "",
    oldInput: {
      firstName: options.oldInput?.firstName || "",
      lastName: options.oldInput?.lastName || "",
      email: options.oldInput?.email || "",
      phoneNumber: options.oldInput?.phoneNumber || "",
      userType: options.oldInput?.userType || ""
    },
    user: {}
  });
};

const renderForgotPassword = (res, options = {}) => {
  res.render("auth/forgot-password", {
    pageTitle: "Forgot Password",
    currentPage: "forgot-password",
    isLoggedIn: false,
    errors: options.errors || [],
    success: options.success || "",
    error: options.error || "",
    resetLink: options.resetLink || "",
    oldInput: {
      email: options.oldInput?.email || ""
    },
    user: {}
  });
};

const renderResetPassword = (res, options = {}) => {
  res.render("auth/reset-password", {
    pageTitle: "Reset Password",
    currentPage: "reset-password",
    isLoggedIn: false,
    errors: options.errors || [],
    success: options.success || "",
    error: options.error || "",
    token: options.token || "",
    isTokenValid: options.isTokenValid !== false,
    oldInput: {},
    user: {}
  });
};

const renderProfile = (req, res, options = {}) => {
  res.render("account/profile", {
    pageTitle: "My Profile",
    currentPage: "profile",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    profileUser: options.profileUser,
    success: options.success || "",
    error: options.error || ""
  });
};

const renderEditProfile = (req, res, options = {}) => {
  res.render("account/edit-profile", {
    pageTitle: "Edit Profile",
    currentPage: "profile",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    errors: options.errors || [],
    success: options.success || "",
    error: options.error || "",
    oldInput: {
      firstName: options.oldInput?.firstName || "",
      lastName: options.oldInput?.lastName || "",
      email: options.oldInput?.email || "",
      phoneNumber: options.oldInput?.phoneNumber || ""
    }
  });
};

const findValidResetUser = (token) =>
  User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

exports.getLogin = (req, res) => {
  const { success, error } = consumeFlashMessages(req);
  renderLogin(res, { success, error });
};

exports.getSignup = (req, res) => {
  const { success, error } = consumeFlashMessages(req);
  renderSignup(res, { success, error });
};

exports.postSignup = [
  ...signupValidators,
  async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return renderSignup(res, {
        errors: errors.array().map((err) => err.msg),
        oldInput: { firstName, lastName, email, phoneNumber, userType }
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,
        userType
      });

      await user.save();

      req.session.success = "Account created successfully. Please log in.";
      return res.redirect("/login");
    } catch (err) {
      return renderSignup(res, {
        errors: [err.message],
        oldInput: { firstName, lastName, email, phoneNumber, userType }
      });
    }
  }
];

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return renderLogin(res, {
        errors: ["User does not exist"],
        oldInput: { email }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return renderLogin(res, {
        errors: ["Invalid Password"],
        oldInput: { email }
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = user;
    await req.session.save();

    if (user.userType === "host") {
      return res.redirect("/host/host-product-list");
    }

    if (user.userType === "deliveryboy") {
      return res.redirect("/delivery/orders");
    }

    return res.redirect("/");
  } catch (err) {
    return renderLogin(res, {
      errors: ["Unable to log in right now. Please try again."],
      oldInput: { email }
    });
  }
};

exports.getForgotPassword = (req, res) => {
  const { success, error } = consumeFlashMessages(req);
  renderForgotPassword(res, { success, error });
};

exports.postForgotPassword = [
  check("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  async (req, res) => {
    const { email } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return renderForgotPassword(res, {
        errors: errors.array().map((err) => err.msg),
        oldInput: { email }
      });
    }

    let resetLink = "";

    try {
      const user = await User.findOne({ email });

      if (user) {
        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        resetLink = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;
        console.log(`Password reset link for ${email}: ${resetLink}`);
      }

      return renderForgotPassword(res, {
        success: "If an account with that email exists, a password reset link has been prepared. Email delivery is not configured in this project, so use the link below when it appears.",
        resetLink,
        oldInput: { email }
      });
    } catch (err) {
      return renderForgotPassword(res, {
        errors: ["Unable to start password reset right now. Please try again."],
        oldInput: { email }
      });
    }
  }
];

exports.getResetPassword = async (req, res) => {
  const token = String(req.params.token || "").trim();

  try {
    const user = await findValidResetUser(token);

    if (!user) {
      return renderResetPassword(res, {
        token,
        isTokenValid: false,
        errors: ["This reset link is invalid or has expired."]
      });
    }

    return renderResetPassword(res, { token });
  } catch (err) {
    return renderResetPassword(res, {
      token,
      isTokenValid: false,
      errors: ["Unable to verify this reset link right now."]
    });
  }
};

exports.postResetPassword = [
  ...resetPasswordValidators,
  async (req, res) => {
    const token = String(req.body.token || "").trim();
    const { password } = req.body;
    const errors = validationResult(req);

    let user;

    try {
      user = await findValidResetUser(token);
    } catch (err) {
      return renderResetPassword(res, {
        token,
        isTokenValid: false,
        errors: ["Unable to reset password right now."]
      });
    }

    if (!user) {
      return renderResetPassword(res, {
        token,
        isTokenValid: false,
        errors: ["This reset link is invalid or has expired."]
      });
    }

    if (!errors.isEmpty()) {
      return renderResetPassword(res, {
        token,
        errors: errors.array().map((err) => err.msg)
      });
    }

    try {
      user.password = await bcrypt.hash(password, 12);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      req.session.success = "Password reset successfully. Please log in with your new password.";
      return res.redirect("/login");
    } catch (err) {
      return renderResetPassword(res, {
        token,
        errors: ["Unable to save the new password right now."]
      });
    }
  }
];

exports.getProfile = async (req, res, next) => {
  const { success, error } = consumeFlashMessages(req);

  try {
    const profileUser = await User.findById(req.session.user._id).select(
      "firstName lastName email phoneNumber userType cart"
    );

    if (!profileUser) {
      req.session.isLoggedIn = false;
      req.session.user = null;
      req.session.error = "Please log in again to continue.";
      return req.session.save(() => res.redirect("/login"));
    }

    return renderProfile(req, res, { profileUser, success, error });
  } catch (err) {
    return next(err);
  }
};

exports.getEditProfile = async (req, res, next) => {
  try {
    const profileUser = await User.findById(req.session.user._id).select(
      "firstName lastName email phoneNumber"
    );

    if (!profileUser) {
      req.session.isLoggedIn = false;
      req.session.user = null;
      req.session.error = "Please log in again to continue.";
      return req.session.save(() => res.redirect("/login"));
    }

    return renderEditProfile(req, res, {
      oldInput: {
        firstName: profileUser.firstName,
        lastName: profileUser.lastName,
        email: profileUser.email,
        phoneNumber: profileUser.phoneNumber
      }
    });
  } catch (err) {
    return next(err);
  }
};

exports.postUpdateProfile = [
  ...profileValidators,
  async (req, res, next) => {
    const { firstName, lastName, email, phoneNumber } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return renderEditProfile(req, res, {
        errors: errors.array().map((err) => err.msg),
        oldInput: { firstName, lastName, email, phoneNumber }
      });
    }

    try {
      const profileUser = await User.findById(req.session.user._id);

      if (!profileUser) {
        req.session.isLoggedIn = false;
        req.session.user = null;
        req.session.error = "Please log in again to continue.";
        return req.session.save(() => res.redirect("/login"));
      }

      profileUser.firstName = firstName.trim();
      profileUser.lastName = String(lastName || "").trim();
      profileUser.email = email;
      profileUser.phoneNumber = phoneNumber.trim();
      await profileUser.save();

      req.session.user = profileUser;
      req.session.success = "Profile updated successfully.";

      return req.session.save(() => res.redirect("/profile"));
    } catch (err) {
      return next(err);
    }
  }
];

exports.postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
