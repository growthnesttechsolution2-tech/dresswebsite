const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mainCategory: { type: String, default: "Women's Dress" },
    subCategory: { type: String },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    stock: { type: Number, default: 0 },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    images: { type: [String], default: [] },
    about: { type: String },
    description: { type: String },
    status: { type: String, default: "Active" },
    shippingCharge: { type: Number, default: 0 },
    freeShipping: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);