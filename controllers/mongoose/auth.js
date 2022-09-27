const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { CourierClient } = require("@trycourier/courier");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../../models/mongoose/user");

const courier = CourierClient({
  authorizationToken: process.env.AUTH_TOKEN,
});

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  message = message.length > 0 ? message[0] : null;

  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: message,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid Email");
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
          req.flash("error", "Incorrect Password");
          res.redirect("/login");
        })
        .catch((err) => console.log(err)); //only executes if something went wrong with bcrypt and not when pswds do not match
    })
    .catch((err) => console.log(err));
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  message = message.length > 0 ? message[0] : null;

  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    errorMessage: message,
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({ email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash("error", "Email already exists");
        return res.redirect("/signup");
      }
      if (password !== confirmPassword) {
        req.flash("error", "Password mistmatch");
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
                title: "Welcome to Node Shop!",
                body: `Welcome to our shop. You are all set. Hope u enjoy your time with us.Feel free to reach out to us for any feedback or queries.`,
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
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log("Session Over");
    console.log(err);
    res.redirect("/login");
  });
};

exports.getResetPassword = (req, res, next) => {
  let message = req.flash("error");
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
          req.flash("error", `No account with this email found`);
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
              title: "Password Reset- Node Shop",
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
    let message = req.flash("error");
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
    .catch((err) => console.log(err));
};
