const Product = require("../models/product");
const fs = require("fs").promises;

const LOCATION_OPTIONS = [
  "Bangalore",
  "Shivamogga",
  "Sagar",
  "Hosanagara",
  "Soraba",
  "Shikaripur",
  "Bhadravathi",
  "Tarikere"
];

const ALLOWED_SIZES = ["S","M","L","XL","XXL","1","2","3","4","5","6","7","8","9","10"];

// Render Add Product Form
exports.getAddProduct = (req, res, next) => {
  res.render("host/edit-product", {
    pageTitle: "Add Product",
    currentPage: "addProduct",
    editing: false,
    product: null,
    locationOptions: LOCATION_OPTIONS,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

// Render Edit Product Form
exports.getEditProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const editing = req.query.editing === "true";

    const product = await Product.findById(productId);
    if (!product) return res.redirect("/host/host-product-list");

    res.render("host/edit-product", {
      pageTitle: "Edit Product",
      currentPage: "host-products",
      editing,
      product,
      locationOptions: LOCATION_OPTIONS,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching product");
  }
};

// List All Host Products
exports.getHostProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ hostId: req.session.user._id });
    res.render("host/host-product-list", {
      registeredProducts: products,
      pageTitle: "Host Products",
      currentPage: "host-products",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products");
  }
};

// Add Product
exports.postAddProduct = async (req, res, next) => {
  try {
    const {
      productName,
      key,
      price,
      description = "",
      location = "",
      stock = 0
    } = req.body;

    if (!req.file) return res.status(422).send("No image provided");
    if (!productName || !key || !price) return res.status(422).send("Product name, key, and price are required");

    const keys = key.split(",").map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return res.status(422).send("At least one key is required");

    // Parse numbers
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(422).send("Invalid price");
    if (isNaN(parsedStock) || parsedStock < 0) return res.status(422).send("Invalid stock");

    // Handle sizes
    const sizes = Array.isArray(req.body.availableSizes)
      ? req.body.availableSizes
      : req.body.availableSizes
        ? [req.body.availableSizes]
        : [];
    const filteredSizes = sizes.filter(size => ALLOWED_SIZES.includes(size));

    const product = new Product({
      productName,
      key: keys,
      price: parsedPrice,
      stock: parsedStock,
      availableSizes: filteredSizes,
      location: location.trim(),
      hostId: req.session.user._id,
      rating: { stars: 0, count: 0 },
      photo: req.file.path.replace(/\\/g, "/"),
      description: description.trim(),
    });

    await product.save();
    res.redirect("/host/host-product-list");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding product");
  }
};

// Edit Product
exports.postEditProduct = async (req, res, next) => {
  try {
    const {
      id,
      productName,
      key,
      price,
      description = "",
      location = "",
      stock = 0
    } = req.body;

    if (!id || !productName || !key || !price) return res.status(422).send("ID, product name, key, and price are required");

    const product = await Product.findById(id);
    if (!product) return res.status(404).send("Product not found");

    const keys = key.split(",").map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return res.status(422).send("At least one key is required");

    // Parse numbers
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(422).send("Invalid price");
    if (isNaN(parsedStock) || parsedStock < 0) return res.status(422).send("Invalid stock");

    // Handle sizes
    const sizes = Array.isArray(req.body.availableSizes)
      ? req.body.availableSizes
      : req.body.availableSizes
        ? [req.body.availableSizes]
        : [];
    const filteredSizes = sizes.filter(size => ALLOWED_SIZES.includes(size));

    // Update product
    product.productName = productName;
    product.key = keys;
    product.price = parsedPrice;
    product.stock = parsedStock;
    product.availableSizes = filteredSizes;
    product.location = location.trim();
    product.description = description.trim();
    if (!product.hostId) product.hostId = req.session.user._id;

    // Handle photo replacement
    if (req.file) {
      try {
        if (product.photo) await fs.unlink(product.photo);
      } catch (err) {
        console.log("Error deleting old photo:", err);
      }
      product.photo = req.file.path.replace(/\\/g, "/");
    }

    await product.save();
    res.redirect("/host/host-product-list");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error editing product");
  }
};

// Delete Product
exports.postDeleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    await Product.findByIdAndDelete(productId);
    res.redirect("/host/host-product-list");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product");
  }
};
