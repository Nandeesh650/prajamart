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

exports.getCartList = async (req, res, next) => {
  const userId = req.session.user._id;
  const user = await User.findById(userId).populate('cart');
  res.render("store/cart-list", {
    cartProducts: user.cart,
    pageTitle: "My Cart",
    currentPage: "cart",
    isLoggedIn: req.isLoggedIn, 
    user: req.session.user,
  });
};

exports.postAddToCart = async (req, res, next) => {
  const productId = req.body.id;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (!user.cart.includes(productId)) {
    user.cart.push(productId);
    await user.save();
  }
  res.redirect("/cart");
};

exports.postRemoveFromCart = async (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (user.cart.includes(productId)) {
    user.cart = user.cart.filter(item => item != productId);
    await user.save();
  }
  res.redirect("/cart");
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

exports.getSearch = async (req, res, next) => {
  const query = req.query.query || "";
  
  if (!query.trim()) {
    return res.render("store/search-results", {
      searchResults: [],
      searchQuery: "",
      pageTitle: "Search Results",
      currentPage: "search",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      message: "Please enter a search term"
    });
  }

  try {
    const searchResults = await Product.find({
      $or: [
        { productName: { $regex: query, $options: "i" } },
        { key: { $regex: query, $options: "i" } }
      ]
    });

    res.render("store/search-results", {
      searchResults: searchResults,
      searchQuery: query,
      pageTitle: "Search Results",
      currentPage: "search",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      message: searchResults.length === 0 ? "No products found matching your search." : ""
    });
  } catch (error) {
    console.log("Search error:", error);
    res.render("store/search-results", {
      searchResults: [],
      searchQuery: query,
      pageTitle: "Search Results",
      currentPage: "search",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      message: "Error performing search"
    });
  }
};
