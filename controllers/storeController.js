const Product = require("../models/product");
const Post = require("../models/post");
const User = require("../models/user");

const LOCATION_OPTIONS = [
  "Bangalore", "Shivamogga", "Sagar", "Hosanagara", 
  "Soraba", "Shikaripur", "Bhadravathi", "Tarikere"
];

const requireSessionUser = (req, res) => {
  if (req.session.user?._id) {
    return req.session.user._id;
  }

  req.session.error = "Please log in to use your cart.";
  res.redirect("/login");
  return null;
};

const buildProductFilter = (query, location) => {
  const trimmedQuery = (query || "").trim();
  const trimmedLocation = (location || "").trim();
  const filter = {};

  if (trimmedQuery) {
    filter.$or = [
      { productName: { $regex: trimmedQuery, $options: "i" } },
      { key: { $regex: trimmedQuery, $options: "i" } },
      { location: { $regex: trimmedQuery, $options: "i" } }
    ];
  }

  if (trimmedLocation) {
    filter.location = trimmedLocation;
  }

  return { filter, trimmedQuery, trimmedLocation };
};

exports.getIndex = async (req, res, next) => {
  try {
    const [registeredProducts, posts] = await Promise.all([
      Product.find().populate("hostId", "firstName lastName"),
      Post.find()
        .sort({ createdAt: -1 })
        .populate("createdBy", "firstName lastName")
        .limit(6)
    ]);

    res.render("store/index", {
      registeredProducts,
      posts,
      pageTitle: "prajamart Product",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.log("Error fetching products for index:", err);
    res.render("store/index", {
      registeredProducts: [],
      posts: [],
      pageTitle: "prajamart Product",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  }
};

exports.getProducts = (req, res, next) => {
  const { filter, trimmedQuery, trimmedLocation } = buildProductFilter(
    req.query.query,
    req.query.location
  );

  Product.find(filter)
    .populate('hostId', 'firstName lastName')
    .then((registeredProducts) => {
      res.render("store/product-list", {
        registeredProducts: registeredProducts,
        pageTitle: "Products List",
        currentPage: "Products",
        searchQuery: trimmedQuery,
        selectedLocation: trimmedLocation,
        locationOptions: LOCATION_OPTIONS,
        isLoggedIn: req.isLoggedIn, 
        user: req.session.user,
      });
    })
    .catch((err) => {
      console.log("Error fetching products:", err);
      res.render("store/product-list", {
        registeredProducts: [],
        pageTitle: "Products List",
        currentPage: "Products",
        searchQuery: trimmedQuery,
        selectedLocation: trimmedLocation,
        locationOptions: LOCATION_OPTIONS,
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
  const userId = requireSessionUser(req, res);

  if (!userId) {
    return;
  }

  try {
    const user = await User.findById(userId).populate('cart');

    if (!user) {
      req.session.isLoggedIn = false;
      req.session.user = null;
      req.session.error = "Please log in again to view your cart.";
      return res.redirect("/login");
    }

    res.render("store/cart-list", {
      cartProducts: user.cart,
      pageTitle: "My Cart",
      currentPage: "cart",
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddToCart = async (req, res, next) => {
  const productId = req.body.productId || req.body.id;
  const userId = requireSessionUser(req, res);

  if (!userId) {
    return;
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      req.session.isLoggedIn = false;
      req.session.user = null;
      req.session.error = "Please log in again to use your cart.";
      return res.redirect("/login");
    }

    const alreadyInCart = user.cart.some((item) => String(item) === String(productId));

    if (!alreadyInCart) {
      user.cart.push(productId);
      await user.save();
    }

    res.redirect("/cart");
  } catch (err) {
    next(err);
  }
};

exports.postRemoveFromCart = async (req, res, next) => {
  const productId = req.params.productId;
  const userId = requireSessionUser(req, res);

  if (!userId) {
    return;
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      req.session.isLoggedIn = false;
      req.session.user = null;
      req.session.error = "Please log in again to use your cart.";
      return res.redirect("/login");
    }

    user.cart = user.cart.filter((item) => String(item) !== String(productId));
    await user.save();

    res.redirect("/cart");
  } catch (err) {
    next(err);
  }
};

exports.getProductDetails = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .populate('hostId', 'firstName lastName email')
    .then((product) => {
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
    })
    .catch((err) => {
      console.log("Error fetching product details: ", err);
      res.redirect("/products");
    });
};

exports.getSearch = async (req, res, next) => {
  const query = req.query.query || "";
  const location = req.query.location || "";
  const { filter, trimmedQuery, trimmedLocation } = buildProductFilter(query, location);
  
  if (!trimmedQuery && !trimmedLocation) {
    return res.render("store/search-results", {
      searchResults: [],
      searchQuery: "",
      selectedLocation: "",
      locationOptions: LOCATION_OPTIONS,
      pageTitle: "Search Results",
      currentPage: "search",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      message: "Please enter a search term or choose a store"
    });
  }

  try {
    const searchResults = await Product.find(filter);

    res.render("store/search-results", {
      searchResults: searchResults,
      searchQuery: trimmedQuery,
      selectedLocation: trimmedLocation,
      locationOptions: LOCATION_OPTIONS,
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
      searchQuery: trimmedQuery,
      selectedLocation: trimmedLocation,
      locationOptions: LOCATION_OPTIONS,
      pageTitle: "Search Results",
      currentPage: "search",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      message: "Error performing search"
    });
  }
};
