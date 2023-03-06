const path = require("path");
// const https = reuire("https");
const fs = require("fs");
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

dotenv.config();

//const errorController = require("./controllers/mysql/error");
// const errorController = require("./controllers/mongodb/error");
const errorController = require("./controllers/mongoose/error");
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
const csrfProtection = csrf();

/*
const privateKey = fs.readFileSync("server.key");
const certificate = fs.readFileSync("server.cert");
*/
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//only allowing particular file uploads
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.set("view engine", "ejs");
app.set("views", "views");
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

//bodyParser.urlencoded only parse req body in text form. Binary data can't be parsed. So we use multer.
app.use(bodyParser.urlencoded({ extended: false }));

//single - Returns middleware that processes a single file associated with the given form field. "imageUrl" is the name of imageUrl file input field
//multer is used to parse multipart form -data (text as well as binary data)
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images"))); //helps to show static images stored in images folder

app.use(
  session({
    secret: "confidential",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection); // used to protect against csrf attack, must be used after session middleware
app.use(flash()); //store error message in session, and remove it once error has been taken care of, must be used after session middleware

//middleware to pass the following attributes to all views rendered. Include hidden input to all views with POST method form.
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//middleware to add user to request body
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  // User.findByPk(1)
  // User.findById("6307db3822c8b724936fda41")
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      // user.cart = user.cart || { items: [] };
      // req.user = new User(user.name, user.email, user.cart, user._id);
      req.user = user;
      // req.isLoggedIn = req.get('Cookie').trim().split("=")[1]; -> Getting cookie value set by postLogin request
      next();
    })
    .catch((err) => {
      // throw new Error(err) -> this is not used when we want to throw error through express middlware. Important: we can never
      //reach that middleware if we are trying to throw inside then/catch block or callbacks. We can only reach it through
      //synchronous codeflow.
      next(new Error("Problem while fetching user from database."));
    });
  // next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);
app.use(errorController.get404);

//this is a special middleware by express, where we can directly catch error throw next(error)
app.use((error, req, res, next) => {
  // res.redirect('/500') -> shouldn't redirect because if error is thrown from user middleware, the app will enter infinite loop and
  // keep switching between this middleware and user middleware , because middlewares are parsed from top to bottom.
  res.status(500).render("500", {
    pageTitle: "Error",
    path: "/500",
    reason: error,
    isAuthenticated: req.user,
  });
});

mongoose
  .connect(process.env.MONGODB_URL)
  .then((result) => {
    /*
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
    */
    console.log("Connected to MongoDb via mongoose");
    app.listen(process.env.PORT || 3000);
   /* https
      .createServer({ key: privateKey, cert: certificate }, app)
      .listen(process.env.PORT || 3000); */
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
