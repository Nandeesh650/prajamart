const Product = require("../models/product");
const User = require("../models/user");

exports.getIndex = (req, res, next) => {
  console.log("Session Value: ", req.session);
  Product.find().then((registeredProducts) => {
    res.render("store/index", {
      registeredProducts: registeredProducts,
      pageTitle: "prajamart Product",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  });
};

exports.getProducts = (req, res, next) => {
  Product.find().then((registeredProducts) => {
    res.render("store/product-list", {
      registeredProducts: registeredProducts,
      pageTitle: "Products List",
      currentPage: "Products",
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  });
};

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.isLoggedIn, 
    user: req.session.user,
  });
};

exports.getFavouriteList = async (req, res, next) => {
  const userId = req.session.user._id;
  const user = await User.findById(userId).populate('favourites');
  res.render("store/favourite-list", {
    favouriteProducts: user.favourites,
    pageTitle: "My Favourites",
    currentPage: "favourites",
    isLoggedIn: req.isLoggedIn, 
    user: req.session.user,
  });
};

exports.postAddToFavourite = async (req, res, next) => {
  const productId = req.body.id;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (!user.favourites.includes(productId)) {
    user.favourites.push(productId);
    await user.save();
  }
  res.redirect("/favourites");
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (user.favourites.includes(productId)) {
    user.favourites = user.favourites.filter(fav => fav != productId);
    await user.save();
  }
  res.redirect("/favourites");
};

exports.getProductDetails = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId).then((product) => {
    if (!product) {
      console.log("Product not found");
      res.redirect("/products");
    } else {
      res.render("store/product-detail", {
        product: product,
        pageTitle: "Product Detail",
        currentPage: "Products",
        isLoggedIn: req.isLoggedIn, 
        user: req.session.user,
      });
    }
  });
};
