const Product = require("../../models/mongoose/product");
const { ProductSchema } = require("../../validation-schema/validation");
const ERRORS = require('../../constants/errors')

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    errorMessage: null,
    hasError: false
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  ProductSchema.validateAsync(
    {
      title,
      imageUrl,
      price,
      description,
    },
    { abortEarly: false }
  )
    .then((result) => {
      const product = new Product({
        title,
        price,
        description,
        imageUrl,
        userId: req.user //even though we pass entire user object, mongoose will only store userId, beacuse of model definition and relation mentioned through 'ref'
      });

      return product.save(); //mongoose method
    })
    .then((result) => {
      console.log(`Product named '${title}' Created`);
      res.status(201).redirect("/admin/products");
    })
    .catch((error) => {
      if (error.isJoi) {
        error = error.details.map((err) => err.message).join(" ; ");
        return res.status(422).render("admin/edit-product", {
          pageTitle: "Add Product",
          path: "/admin/add-product",
          editing: false,
          hasError: true,
          product: {
            title: title,
            imageUrl: imageUrl,
            price: price,
            description: description
          },
          errorMessage: error
        });
      }

      //there is some problem with saving product
      /** this is one way. Useful only when mongo server is down
      return res.status(500).render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: true,
        product: {
          title: title,
          imageUrl: imageUrl,
          price: price,
          description: description,
        },
        errorMessage: "Database Operation failed. Please try after some time.",
      });
       */
      // second way is to display 500 page.Useful when our server is crashing because of our code.
      // res.redirect('/500')

      //third way is to use express middleware
       error = new Error(
        ERRORS.PRODUCT_CREATION_ERROR
      );
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById({ _id: prodId, userId: req.user._id })
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        errorMessage: null,
        hasError: false
      });
    })
    .catch((err) =>{
      err = new Error(
        ERRORS.PRODUCT_EDIT_ERROR
      );
      return next(err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDescription = req.body.description;

  ProductSchema.validateAsync(
    {
      title: updatedTitle,
      imageUrl: updatedImageUrl,
      price: updatedPrice,
      description: updatedDescription
    },
    { abortEarly: false }
  )
    .then((result) => {
      console.log("No Validation errors");
      Product.findById(prodId)
        .then((product) => {
          if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect("/admin/products");
          }
          product.title = updatedTitle;
          product.price = updatedPrice;
          product.description = updatedDescription;
          product.imageUrl = updatedImageUrl;

          return product.save().then((result) => {
            console.log("Product Updated Successfully");
            res.redirect("/admin/products");
          });
        })
        .catch((err) => {
          //there is some problem with saving product or while finding the product.
          /* 
          return res.status(500).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            hasError: true,
            product: {
              title: updatedTitle,
              imageUrl: updatedImageUrl,
              price: updatedPrice,
              description: updatedDescription,
              _id: prodId
            },
            errorMessage: "Something went wrong.One or more Database operation failed.Please try after some time."
          });
          */
          // res.redirect('/500')
          err = new Error(
            ERRORS.PRODUCT_EDIT_FAIL
          );
          return next(err);
        });
    })
    .catch((error) => {
      error = error.details.map((err) => err.message).join(" ; ");
      return res.status(422).render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: true,
        hasError: true,
        product: {
          title: updatedTitle,
          imageUrl: updatedImageUrl,
          price: updatedPrice,
          description: updatedDescription,
          _id: prodId,
        },
        errorMessage: error
      });
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({
    userId: req.user._id,
  })
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
      });
    })
    .catch((err) => {
      err = new Error(
        ERRORS.USER_PRODUCTS_ERROR
      );
      return next(err);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  // Product.findByIdAndRemove(prodId)
  Product.deleteOne({ _id: prodId, userId: req.user._id.toString() })
    .then(() => {
      console.log("Product deleted.");
      res.redirect("/admin/products");
    })
    .catch((err) =>{
      err = new Error(
       ERRORS.PRODUCT_DELETE_ERROR
      );
      return next(err);
    });
};
