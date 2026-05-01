const path = require("path");
const Product = require("../models/product");
const fs = require("fs").promises;
const rootDir = require("../utils/pathUtil");

const LOCATION_OPTIONS = [
  "Bangalore", "Shivamogga", "Sagar", "Hosanagara", 
  "Soraba", "Shikaripur", "Bhadravathi", "Tarikere"
];

const ALLOWED_SIZES = ["S", "M", "L", "XL", "XXL", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveProductPhotoPath = (photoPath) => {
  if (!photoPath) return null;

  const normalizedPath = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const relativePath = normalizedPath.startsWith("public/")
    ? normalizedPath.slice("public/".length)
    : normalizedPath;

  return path.join(rootDir, relativePath);
};

const deleteProductPhotos = async (photos = []) => {
  for (const photoPath of photos) {
    const absolutePath = resolveProductPhotoPath(photoPath);
    if (!absolutePath) continue;

    try {
      await fs.unlink(absolutePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error(`Failed to delete product photo: ${absolutePath}`, err);
      }
    }
  }
};

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
    const searchQuery = (req.query.query || "").trim();
    const safeSearchQuery = escapeRegex(searchQuery);
    const productFilter = { hostId: req.session.user._id };

    if (safeSearchQuery) {
      productFilter.$or = [
        { productName: { $regex: safeSearchQuery, $options: "i" } },
        { key: { $regex: safeSearchQuery, $options: "i" } },
        { location: { $regex: safeSearchQuery, $options: "i" } },
        { description: { $regex: safeSearchQuery, $options: "i" } }
      ];
    }

    const products = await Product.find(productFilter).sort({ _id: -1 });
    res.render("host/host-product-list", {
      registeredProducts: products,
      searchQuery,
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
      await deleteProductPhotos(product.photos);
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
    if (product) {
      await deleteProductPhotos(product.photos);
    }

    await Product.findByIdAndDelete(req.params.productId);
    res.redirect("/host/host-product-list");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product");
  }
};
