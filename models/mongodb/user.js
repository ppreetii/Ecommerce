const mongodb = require("mongodb");

const getDb = require("../../util/mongodb/database").getDb;

class User {
  constructor(username, email, cart, userId) {
    this.name = username;
    this.email = email;
    this.cart = cart;
    this._id = userId;
  }

  save() {
    const db = getDb();
    return db.collection("users").insertOne(this);
  }

  static findById(userId) {
    const db = getDb();
    return db
      .collection("users")
      .findOne({ _id: new mongodb.ObjectId(userId) });
  }

  addToCart(product) {
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
    const updatedCart = {
      items: [...this.cart.items],
    };
    const db = getDb();
    db.collection("users").updateOne(
      { _id: new mongodb.ObjectId(this._id) },
      { $set: { cart: updatedCart } } //this will only update the cart value
    );
  }

  getCart() {
    const db = getDb();
    const productIds = this.cart.items.map((item) => {
      return item.productId;
    });

    return db
      .collection("products")
      .find({ _id: { $in: productIds } })
      .toArray()
      .then((products) => {

        const productsData = products.map((product) => {
          product.quantity = this.cart.items.find((item) => {
            if (item.productId.toString() === product._id.toString())
              return item;
          }).quantity;
        
          return product;
        });

        if(productsData.length !== this.cart.items.length){
          this.cart.items = productsData.map(product =>{
            return {
              productId: product._id,
              quantity: product.quantity,
            }
          });
          db.collection("users").updateOne(
            { _id: new mongodb.ObjectId(this._id) },
            { $set: { cart: this.cart } } //this will only update the cart value
          );
        }

        return productsData;
      });
  }

  deleteItemFromCart(productId) {
    this.cart.items = this.cart.items.filter((item) => {
      return item.productId.toString() !== productId.toString();
    });

    const db = getDb();
    return db.collection("users").updateOne(
      { _id: new mongodb.ObjectId(this._id) },
      { $set: { cart: this.cart } } //this will only update the cart value
    );
  }

  addOrder() {
    const db = getDb();
    return this.getCart()
      .then((products) => {
        const order = {
          items: products,
          user: {
            _id: this._id,
            name: this.name,
          },
        };
        return db.collection("orders").insertOne(order);
      })
      .then((result) => {
        this.cart.items = [];
        return db
          .collection("users")
          .updateOne({ _id: this._id }, { $set: { cart: this.cart } });
      })
      .catch((err) => console.log(err));
  }

  getOrders() {
    const db = getDb();
    return db.collection("orders").find({ "user._id": this._id }).toArray();
  }
}

module.exports = User;
