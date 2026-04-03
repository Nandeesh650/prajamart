const Product = require("../models/product");
const fs = require("fs");

const LOCATION_OPTIONS = [
  "Bangalore",
  "Chennai",
  "Delhi",
  "Hyderabad",
  "Kolkata",
  "Mumbai",
  "Pune",
];

exports.getAddProduct = (req, res, next) => {
  res.render("host/edit-product", {
    pageTitle: "Add Product to prajamart",
    currentPage: "addProduct",
    editing: false,
    product: null,
    locationOptions: LOCATION_OPTIONS,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  const editing = req.query.editing === "true";

  Product.findById(productId).then((product) => {
    if (!product) {
      console.log("Product not found for editing.");
      return res.redirect("/host/host-product-list");
    }

    console.log(productId, editing, product);
    res.render("host/edit-product", {
      product: product,
      pageTitle: "Edit your Product",
      currentPage: "host-products",
      editing: editing,
      locationOptions: LOCATION_OPTIONS,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getHostProducts = (req, res, next) => {
  Product.find().then((registeredProducts) => {
    res.render("host/host-product-list", {
      registeredProducts: registeredProducts,
      pageTitle: "Host Products List",
      currentPage: "host-products",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.postAddProduct = (req, res, next) => {
  const { productName, key, price, description, location } = req.body;
  console.log(productName, key, price, description, location);
  console.log(req.file);

  if (!req.file) {
    return res.status(422).send("No image provided");
  }

  const photo = req.file.path;

  const product = new Product({
    productName,
    key,
    price,
    location: (location || "").trim(),
    hostId: req.session.user._id,
    rating: {
      stars: 0,
      count: 0,
    },
    photo,
    description,
  });
  product.save().then(() => {
    console.log("Product Saved successfully");
  });

  res.redirect("/host/host-product-list");
};

exports.postEditProduct = (req, res, next) => {
  const { id, productName, key, price, description, location } = req.body;
  
  Product.findById(id)
    .then((product) => {
      product.productName = productName;
      product.key = key;
      product.price = price;
      product.location = (location || "").trim();
      
      // Ensure hostId is set
      if (!product.hostId) {
        product.hostId = req.session.user._id;
      }
      
      product.description = description;

      if (req.file) {
        fs.unlink(product.photo, (err) => {
          if (err) {
            console.log("Error while deleting file ", err);
          }
        });
        product.photo = req.file.path;
      }

      product
        .save()
        .then((result) => {
          console.log("Product updated ", result);
        })
        .catch((err) => {
          console.log("Error while updating ", err);
        });
      res.redirect("/host/host-product-list");
    })
    .catch((err) => {
      console.log("Error while finding product ", err);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  console.log("Came to delete ", productId);
  Product.findByIdAndDelete(productId)
    .then(() => {
      res.redirect("/host/host-product-list");
    })
    .catch((error) => {
      console.log("Error while deleting ", error);
    });
};
