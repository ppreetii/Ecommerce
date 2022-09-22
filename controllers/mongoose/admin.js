const Product = require("../../models/mongoose/product");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    isAuthenticated: req.session.isLoggedIn,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.user, //even though we pass entire user object, mongoose will only store userId, beacuse of model definition and relation mentioned through 'ref'
  });

  product
    .save() //mongoose method
    .then((result) => {
      console.log(`Product named '${title}' Created`);
      res.status(201).redirect("/admin/products");
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDescription = req.body.description;

  Product.findById(prodId)
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      product.imageUrl = updatedImageUrl;

      return product.save();
    })
    .then((result) => {
      console.log("Product Updated Successfully");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find()
    /*
  Because we defined relation between User and Product models, this helps us to get access between these two models more easily using
  certain mongoose method
  For ex: We could have used:

  1. Product
      .find()
      .populate('userId','name') -> Giving only first param would have returned entire user object, but since we passed name
                                    in second argument , we will only get name and _id attributes for user. And thats how we access
                                    limited data that is actually required.
  
  2.  Product
      .find()
      .select('title price -_id') -> each would only have title,price and user attributes, and '-_id' means we don't want id of product
      .populate('userId','name')    which is added by default if we don't exclude it.
  */
    .then((products) => {
      res.status(200).render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  // Product.findByIdAndRemove(prodId)
  Product.findByIdAndDelete(prodId)
    .then(() => {
      console.log("Product deleted.");
      res.redirect("/admin/products");
    })
    .catch((err) => console.log(err));
};
