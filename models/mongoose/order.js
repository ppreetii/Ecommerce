const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  items: [
    {
      product: {
        //better to store product info, because if admin deletes product, we can still get product info from here.
        type: Object,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
    },
  ],
  user: {
    email: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      ref: "User",
      required: true
    }
  }
});

module.exports = mongoose.model("Order", orderSchema);
