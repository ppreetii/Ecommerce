const fs = require("fs");
const path = require("path");

const Product = require("../../models/mongoose/product");
const Order = require("../../models/mongoose/order");
const ERRORS = require("../../constants/errors");
const CONSTANTS = require("../../constants/common");

exports.getProducts = (req, res, next) => {
  Product.find() //unlike mongodb find() method which returns cursor, mongoose find() returns array. We can convert
    // array to cursor with Product.find().cursor() and loop through each element.Use cursor when dealing with large set of documents
    .then((products) => {
      res.status(200).render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
      });
    })
    .catch((err) => {
      err = new Error(ERRORS.PRODUCTS_ERROR);
      return next(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId) //findById is function of mongoose as well
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      err = new Error(ERRORS.PRODUCT_DETAIL_FAIL);
      return next(err);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.status(200).render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
      });
    })
    .catch((err) => {
      err = new Error(ERRORS.PRODUCTS_ERROR);
      return next(err);
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
        products: products,
      });
    })
    .catch((err) => {
      err = new Error(ERRORS.CART_ERROR);
      return next(err);
    });
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
    .catch((err) => {
      err = new Error(ERRORS.CART_DELETE_ERROR);
      return next(err);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({
    user: {
      email: req.user.email,
      userId: req.user._id,
    },
  })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      err = new Error(ERRORS.ORDER_ERROR);
      return next(err);
    });
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
          userId: req.user,
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
    .catch((err) => {
      err = new Error(ERRORS.ORDER_CREATE_ERROR);
      return next(err);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = "invoice-" + orderId + ".pdf";
  const invoicePath = path.join("data", "invoices", invoiceName);

  Order.findById(orderId).then((order) => {
    if (!order) return next(new Error("No Order found."));

    if (order.user.userId.toString() !== req.user._id.toString())
      return next(new Error("Unauthorized."));
    /**
     * This method is fine for small files, however for large files , it will lead to memory overflow for multiple requests.
     * The recommended way is use to stream the file on the file, which is shown after the comment.
     * Note: res is a writable stream. Not all objects are writable streams in node but res is one of them.
     fs.readFile(invoicePath, (err, data) => {
      if (err) {
        return next(err);
      }
      res.setHeader("Content-Type", "application/pdf");
      // this allows us to define how this content should be served to the client.
      //  inline means the browser opens file in broswer itself. Here, we get to print, save and view pdf.
      // attachment means browser directly save the file in our system.
      res.setHeader(
        "Content-Disposition",
        'inline;filename="' + invoiceName + '"'
      );
      // res.setHeader('Content-Disposition','attachment;filename="'+ invoiceName +'"');
      res.send(data);
    });
     */

    const file = fs.createReadStream(invoicePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline;filename="' + invoiceName + '"'
    );
    file.pipe(res);  //writing contents of file in chunks to res.
  });
};
// exports.getCheckout = (req, res, next) => {
//   res.render("shop/checkout", {
//     path: "/checkout",
//     pageTitle: "Checkout",
//   });
// };
