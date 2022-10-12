const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { CourierClient } = require("@trycourier/courier");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../../models/mongoose/user");
const {
  SignUpSchema,
  LoginSchema,
} = require("../../validation-schema/validation");
const ERRORS = require("../../constants/errors");
const CONSTANTS = require("../../constants/common");

const courier = CourierClient({
  authorizationToken: process.env.AUTH_TOKEN,
});

exports.getLogin = (req, res, next) => {
  let message = req.flash(ERRORS.ERROR);
  message = message.length > 0 ? message[0] : null;

  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  LoginSchema.validateAsync(
    {
      email,
      password,
    },
    { abortEarly: false }
  )
    .then((result) => {
      console.log("No Validation Errors");
      User.findOne({ email })
        .then((user) => {
          if (!user) {
            req.flash(ERRORS.ERROR, ERRORS.INVALID_EMAIL);
            return res.redirect("/login");
          }

          bcrypt
            .compare(password, user.password)
            .then((doMatch) => {
              //doMatch = true/false
              if (doMatch) {
                // res.setHeader("Set-Cookie", "loggedIn=true"); -> this sets cookie
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save((err) => {
                  //return is necessary to not go to res redirect line outside if block
                  //making sure session data is stored before we redirect because sometimes storing might take few mS to complete , but
                  //render would have been complete, that time you won't see changes and have to reload the page.
                  console.log(err);
                  res.redirect("/");
                });
              }
              req.flash(ERRORS.ERROR, ERRORS.INVALID_PSWD);
              res.redirect("/login");
            })
            .catch((err) => {
              err = new Error(ERRORS.BCRYPT_FAILURE);
              return next(err);
            }); //only executes if something went wrong with bcrypt and not when pswds do not match
        })
        .catch((err) => {
          err = new Error(ERRORS.LOGIN_USER_ERROR);
          return next(err);
        });
    })
    .catch((error) => {
      error = error.details.map((err) => err.message).join(" ; ");
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: error,
        oldInput: {
          email,
          password,
        },
      });
    });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash(ERRORS.ERROR);
  message = message.length > 0 ? message[0] : null;

  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  SignUpSchema.validateAsync(
    {
      email,
      password,
      confirmPassword,
    },
    { abortEarly: false }
  )
    .then((result) => {
      console.log("No Validation Errors");
      User.findOne({ email })
        .then((userDoc) => {
          if (userDoc) {
            req.flash(ERRORS.ERROR, ERRORS.EMAIL_EXIST);
            return res.redirect("/signup");
          }

          return bcrypt
            .hash(password, 12)
            .then((hashedPassword) => {
              const user = new User({
                email,
                password: hashedPassword,
                cart: { items: [] },
              });

              return user.save();
            })
            .then((result) => {
              res.redirect("/login");
              return courier.send({
                message: {
                  content: {
                    title: CONSTANTS.MSG_TITLE,
                    body: CONSTANTS.MSG_BODY,
                  },
                  to: {
                    email: email,
                  },
                },
              });
            })
            .then((result) => {
              console.log("Email Sent Successfully");
            })
            .catch((err) => {
              err = new Error(ERRORS.SIGNUP_ERROR);
              return next(err);
            });
        })
        .catch((err) => {
          err = new Error(ERRORS.SIGNUP_USER_ERROR);
          return next(err);
        });
    })
    .catch((error) => {
      if (error.isJoi) {
        error = error.details.map((err) => err.message).join(" ; ");
        return res.status(422).render("auth/signup", {
          pageTitle: "Signup",
          path: "/signup",
          errorMessage: error,
          oldInput: {
            email,
            password,
            confirmPassword,
          },
        });
      }

      console.log(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log("Session Over");
    console.log(err);
    res.redirect("/login");
  });
};

exports.getResetPassword = (req, res, next) => {
  let message = req.flash(ERRORS.ERROR);
  message = message.length > 0 ? message[0] : null;

  res.render("auth/reset", {
    pageTitle: "Reset Password",
    path: "/reset",
    errorMessage: message,
  });
};

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          req.flash(ERRORS.ERROR, ERRORS.USER_NOT_FOUND);
          return res.redirect("/reset");
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        return courier.send({
          message: {
            content: {
              title: CONSTANTS.PSWD_RESET_MSG_TITLE,
              body: ` We received a request to change password for this account.Go to
             'http://localhost:3000/reset/${token}" to reset your password.`,
            },
            to: {
              email: email,
            },
            timeout: {
              message: 3600000, // 1 hour in milliseconds
            },
          },
        });
      })
      .then((result) => {
        console.log("Password Reset Mail Sent Successfully");
      })
      .catch((err) => console.log(err));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  }).then((user) => {
    let message = req.flash(ERRORS.ERROR);
    message = message.length > 0 ? message[0] : null;

    res.render("auth/new-password", {
      pageTitle: "New Password",
      path: "/new-password",
      userId: user._id.toString(),
      token,
      errorMessage: message,
    });
  });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const token = req.body.token;
  let resetUser;
  User.findOne({
    _id: userId,
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      err = new Error(ERRORS.PSWD_RESET_ERROR);
      return next(err);
    });
};
