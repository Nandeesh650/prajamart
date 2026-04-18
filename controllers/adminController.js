const Order = require("../models/order");
const Product = require("../models/product");
const fs = require('fs');
const path = require('path');

// ---------------- ADMIN: UPDATE PRODUCT POSTER ----------------
// This replaces the actual product image file on the server
exports.postUpdateProductPoster = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const image = req.file; 

        if (!image) {
            req.session.error = "Please select an image file.";
            return res.redirect("back");
        }

        const product = await Product.findById(productId);
        if (!product) {
            req.session.error = "Product not found.";
            return res.redirect("back");
        }
        
        // PHYSICAL FILE DELETE: Remove the old image from the server
        if (product.photo) {
            const oldPath = path.join(__dirname, '..', product.photo);
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                } catch (err) {
                    console.error("Old file delete failed:", err);
                }
            }
        }

        // UPDATE DATABASE: Set new path
        product.photo = image.path.replace(/\\/g, "/");
        await product.save();

        req.session.success = "Product poster updated successfully!";
        res.redirect("back");
    } catch (err) {
        next(err);
    }
};

// ---------------- ADMIN: ABSOLUTE DELETE ORDER ----------------
// Deletes any order regardless of status or date
exports.postAdminDeleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const result = await Order.findByIdAndDelete(orderId);
        
        if (!result) {
            req.session.error = "Order already deleted or not found.";
            return res.redirect("back");
        }

        req.session.success = "Order permanently removed by Admin.";
        res.redirect("back");
    } catch (err) {
        console.error(err);
        req.session.error = "System error during deletion.";
        res.redirect("back");
    }
};

// ---------------- ADMIN: FORCE STATUS UPDATE ----------------
exports.postAdminUpdateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        await Order.findByIdAndUpdate(orderId, { status: status });
        
        req.session.success = `Admin forced status to: ${status.toUpperCase()}`;
        res.redirect("back");
    } catch (err) {
        res.redirect("back");
    }
};