const mongodb = require("mongodb");

const getDb = require("../../util/mongodb/database").getDb;

class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new mongodb.ObjectId(id) : null;
    this.userId = userId; 
  }

  save() {
    const db = getDb();
    let dbOp;

    if (this._id) {
      //update the product
      dbOp = db
        .collection("products")
        .updateOne({ _id: this._id }, { $set: this });
    } else {
      //add new product
      dbOp = db.collection("products").insertOne(this);
    }
    return dbOp
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static fetchAll() {
    const db = getDb();
    return db
      .collection("products")
      .find()
      .toArray() //it is assumed we will have few dozens documents. It is better to use pagination to deal with large data
      .then((products) => {
        return products;
      })
      .catch((err) => console.log(err));
  }

  static findById(prodId) {
    const db = getDb();
    return (
      db
        .collection("products")
        .find({ _id: mongodb.ObjectId(prodId) })
        .next() //return last object, which is also the only object returned.
        //This line is added because mongodb doesn't know we are fetching single product, and not array of all products
        .then((product) => {
          return product;
        })
        .catch((err) => {
          console.log(err);
          throw "Given product not found in database";
        })
    );
  }

  static deleteById(prodId) {
    const db = getDb();
    return db.collection("products")
    .deleteOne({ _id: new mongodb.ObjectId(prodId) })
    .then(result =>{
      console.log("Product deleted !!")
    })
    .catch(err => console.log(err))
  } 
}
module.exports = Product;
