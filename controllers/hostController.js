const Product = require("../models/product");
const fs = require("fs");

exports.getAddProduct = (req, res, next) => {
  res.render("host/edit-product", {
    pageTitle: "Add Product to prajamart",
    currentPage: "addProduct",
    editing: false,
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
  const { productName, key, price, rating_stars, rating_count, description } = req.body;
  const stars = Number(rating_stars) || 0;
  const count = Number(rating_count) || 0;
  console.log(productName, key, price, rating_stars, rating_count, description);
  console.log(req.file);

  if (!req.file) {
    return res.status(422).send("No image provided");
  }

  const photo = req.file.path;

  const product = new Product({
    productName,
    key,
    price,
    rating: {
      stars,
      count,
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
  const { id, productName, key, price, rating_stars, rating_count, description } =
    req.body;
  const stars = Number(rating_stars) || 0;
  const count = Number(rating_count) || 0;
  Product.findById(id)
    .then((product) => {
      product.productName = productName;
      product.key = key;
      product.price = price;
      if (product.rating && typeof product.rating === 'object') {
        product.rating.stars = stars;
        product.rating.count = count;
      } else {
        product.rating = { stars, count };
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
