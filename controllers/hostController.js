const Product = require("../models/product");
const fs = require("fs").promises;

const LOCATION_OPTIONS = [
  "Bangalore", "Shivamogga", "Sagar", "Hosanagara", 
  "Soraba", "Shikaripur", "Bhadravathi", "Tarikere"
];

const ALLOWED_SIZES = ["S", "M", "L", "XL", "XXL", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// GET: Render Add Product Form
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

// GET: Render Edit Product Form
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

// GET: List All Host Products
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

// POST: Add Product (Handles Multiple Images)
exports.postAddProduct = async (req, res, next) => {
  try {
    const { productName, key, price, description = "", location = "", stock = 0 } = req.body;

    if (!req.files || req.files.length === 0) return res.status(422).send("At least one image is required");

    const imagePaths = req.files.map(file => file.path.replace(/\\/g, "/"));
    const keys = key.split(",").map(k => k.trim()).filter(Boolean);
    
    // Handle Size Checkboxes
    const rawSizes = req.body.availableSizes || [];
    const sizesArray = Array.isArray(rawSizes) ? rawSizes : [rawSizes];
    const filteredSizes = sizesArray.filter(size => ALLOWED_SIZES.includes(size));

    const product = new Product({
      productName,
      key: keys,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      availableSizes: filteredSizes,
      location: location.trim(),
      hostId: req.session.user._id,
      photos: imagePaths,
      description: description.trim(),
    });

    await product.save();
    res.redirect("/host/host-product-list");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding product");
  }
};

// POST: Edit Product (Updates Photos and Sizes)
exports.postEditProduct = async (req, res, next) => {
  try {
    const { id, productName, key, price, description = "", location = "", stock = 0 } = req.body;
    const product = await Product.findById(id);
    if (!product) return res.status(404).send("Product not found");

    // Update Photo Logic
    if (req.files && req.files.length > 0) {
      if (product.photos && product.photos.length > 0) {
        for (const oldPath of product.photos) {
          try { await fs.unlink(oldPath); } catch (err) { console.log("Old file not found, skipping delete."); }
        }
      }
      product.photos = req.files.map(file => file.path.replace(/\\/g, "/"));
    }

    // Update Size Logic
    const rawSizes = req.body.availableSizes || [];
    const sizesArray = Array.isArray(rawSizes) ? rawSizes : [rawSizes];
    product.availableSizes = sizesArray.filter(size => ALLOWED_SIZES.includes(size));

    product.productName = productName;
    product.key = key.split(",").map(k => k.trim()).filter(Boolean);
    product.price = parseFloat(price);
    product.stock = parseInt(stock, 10);
    product.location = location.trim();
    product.description = description.trim();

    await product.save();
    res.redirect("/host/host-product-list");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error editing product");
  }
};

// POST: Delete Product
exports.postDeleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (product && product.photos) {
      for (const path of product.photos) {
        try { await fs.unlink(path); } catch (err) {}
      }
    }
    await Product.findByIdAndDelete(req.params.productId);
    res.redirect("/host/host-product-list");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product");
  }
};