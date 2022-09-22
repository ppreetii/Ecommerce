const path = require("path");

const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);

dotenv.config();

//const errorController = require("./controllers/mysql/error");
const errorController = require("./controllers/mongodb/error");
//const mongoConnect = require("./util/mongodb/database").mongoConnect;
// const User = require("./models/mongodb/user");
const User = require("./models/mongoose/user");

/*
const sequelize = require("./util/mysql/database");
const Product = require("./models/mysql/product");
const User = require("./models/mysql/user");
const Cart = require("./models/mysql/cart");
const CartItem = require("./models/mysql/cart-item");
const Order = require("./models/mysql/order");
const OrderItem = require("./models/mysql/order-item"); 
*/

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const app = express();

const store = new MongoDbStore({
  uri: process.env.MONGODB_URL,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "confidential",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
//middleware to add user to request body
app.use((req, res, next) => {

  if(!req.session.user){
    return next();
  }
  // User.findByPk(1)
  // User.findById("6307db3822c8b724936fda41")
  User.findById(req.session.user._id)
    .then((user) => {
      // user.cart = user.cart || { items: [] };
      // req.user = new User(user.name, user.email, user.cart, user._id);
      req.user = user;
      // req.isLoggedIn = req.get('Cookie').trim().split("=")[1]; -> Getting cookie value set by postLogin request
      next();
    })
    .catch((err) => console.log(err));
  // next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(process.env.MONGODB_URL)
  .then((result) => {
    User.findOne().then((user) => {
      if (!user) {
        const user = new User({
          name: "Preeti",
          email: "test@gmail.com",
          cart: {
            items: [],
          },
        });
        user.save();
      }
    });
    console.log("Connected to MongoDb via mongoose");
    app.listen(process.env.PORT);
    console.log(`Server started at port ${process.env.PORT}`);
  })
  .catch((err) => console.log(err));

/*
mongoConnect(() => {
  app.listen(process.env.PORT);
  console.log(`Server started at port ${process.env.PORT}`);
}); */

// /**
// DEFINING ASSOCIATIONS
// */
// /*
// One -to - Many
// User can have many Product.Conversely, A Product will belong to that particular user
// */
// Product.belongsTo(User, {
//   constraints: true,
//   onDelete: "CASCADE",
// });
// User.hasMany(Product);

// /*
// One -to - One
// User can have one cart.Conversely, A cart will belong to that particular user
// */
// User.hasOne(Cart);
// Cart.belongsTo(User);

// /* Many to Many
//  through is used to connect Cart Model to Product Model though CartItem Model , same logic for Product to Cart
//  we can see cartId and productId in CartItem Model because of these two many-to-many associations
// */
// Cart.belongsToMany(Product, { through: CartItem });
// Product.belongsToMany(Cart, { through: CartItem });

// Order.belongsTo(User);
// User.hasMany(Order);
// Order.belongsToMany(Product, { through: OrderItem });

// //syncing all models
// let _user;
// sequelize
//   // .sync(
//   //   {force : true}   //shouldn't be used in production. this will drop all existing models, and recreate it, where tables won't have any records
//   // )
//   .sync()
//   .then((result) => {
//     return User.findByPk(1);
//   })
//   .then((user) => {
//     if (!user) {
//       return User.create({ name: "Preeti", email: "test@gmail.com" });
//     }

//     return user;
//   })
//   .then((user) => {
//     _user = user;
//     return user.getCart();
//   })
//   .then((cart) => {
//     if (!cart) return _user.createCart();
//     return cart;
//   })
//   .then((cart) => {
//     console.log(`Server started at port ${process.env.PORT}`);
//     app.listen(process.env.PORT);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
