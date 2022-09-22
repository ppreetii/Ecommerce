const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ]
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });

  if (cartProductIndex >= 0) {
    //simply increase qty, because product exists in cart
    this.cart.items[cartProductIndex].quantity += 1;
  } else {
    this.cart.items.push({
      productId: product._id,
      quantity: 1,
    });
  }

  return this.save();
};

userSchema.methods.deleteItemFromCart = function (prodId){
  this.cart.items = this.cart.items.filter(item =>{
    return item.productId.toString() !== prodId.toString()
  });

  return this.save();
}


module.exports = mongoose.model("User", userSchema);
