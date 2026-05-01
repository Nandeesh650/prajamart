const express = require("express");

const legalRouter = express.Router();
const legalController = require("../controllers/legalController");

legalRouter.get("/terms/customer", legalController.getCustomerTerms);
legalRouter.get("/terms/vendor", legalController.getVendorTerms);
legalRouter.get("/terms/delivery-partner", legalController.getDeliveryPartnerTerms);

module.exports = legalRouter;
