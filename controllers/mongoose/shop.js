const Product = require("../../models/mongoose/product");
const Order = require("../../models/mongoose/order");

exports.getProducts = (req, res, next) => {
  Product.find() //unlike mongodb find() method which returns cursor, mongoose find() returns array. We can convert
    // array to cursor with Product.find().cursor() and loop through each element.Use cursor when dealing with large set of documents
    .then((products) => {
      res.status(200).render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products"
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId) //findById is function of mongoose as well
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products"
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getIndex = (req, res, next) => {

  Product.find()
    .then((products) => {
      res.status(200).render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/"
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId", "title")
    .then((user) => {
      const products = user.cart.items.filter((cartItem) => {
        return cartItem.productId !== null;
      });

      if (products.length !== user.cart.items.length) {
        req.user.cart.items = products;
        req.user
          .save()
          .then((result) =>
            console.log("Cart was updated. Some items were removed by admin")
          )
          .catch((err) => console.log(err));
      }

      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products
      });
    })
    .catch((err) => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      // return req.user.addToCart(product);
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({
    user: {
      email: req.user.email,
      userId: req.user._id
    },
  })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders
      });
    })
    .catch((err) => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId", "title price imageUrl")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          product: { ...i.productId._doc },
          quantity: i.quantity,
        };
      });

      const order = new Order({
        items: products,
        user: {
          email: req.user.email,
          userId: req.user
        },
      });

      return order.save();
    })
    .then((result) => {
      req.user.cart.items = [];
      return req.user.save();
    })
    .then((result) => {
      console.log("Order Generated. Whoho!!");
      res.redirect("/orders");
    })
    .catch((err) => console.log(err));
};

// exports.getCheckout = (req, res, next) => {
//   res.render("shop/checkout", {
//     path: "/checkout",
//     pageTitle: "Checkout",
//   });
// };
