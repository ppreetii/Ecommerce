const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");
const sequelize = require("./util/mysql/database");
const Product = require("./models/mysql/product");
const User = require("./models/mysql/user");
const Cart = require("./models/mysql/cart");
const CartItem = require("./models/mysql/cart-item");
const Order = require("./models/mysql/order");
const OrderItem = require("./models/mysql/order-item");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");


const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

//middleware to add user to request body
app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

/** 
DEFINING ASSOCIATIONS
*/
/*
One -to - Many
User can have many Product.Conversely, A Product will belong to that particular user
*/
Product.belongsTo(User, {
  constraints: true,
  onDelete: "CASCADE",
});
User.hasMany(Product);

/*
One -to - One
User can have one cart.Conversely, A cart will belong to that particular user
*/
User.hasOne(Cart);
Cart.belongsTo(User);

/* Many to Many
 through is used to connect Cart Model to Product Model though CartItem Model , same logic for Product to Cart
 we can see cartId and productId in CartItem Model because of these two many-to-many associations 
*/
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

//syncing all models
let _user;
sequelize
  // .sync(
  //   {force : true}   //shouldn't be used in production. this will drop all existing models, and recreate it, where tables won't have any records
  // )
  .sync()
  .then((result) => {
    return User.findByPk(1);
  })
  .then((user) => {
    if (!user) {
      return User.create({ name: "Preeti", email: "test@gmail.com" });
    }

    return user;
  })
  .then((user) => {
    _user = user;
    return user.getCart();
  })
  .then((cart) => {
    if (!cart) return _user.createCart();
    return cart;
  })
  .then((cart) => {
    console.log(`Server started at port ${process.env.PORT}`);
    app.listen(process.env.PORT);
  })
  .catch((error) => {
    console.log(error);
  });
