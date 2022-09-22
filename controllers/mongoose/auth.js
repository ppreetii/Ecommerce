const User = require("../../models/mongoose/user");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    isAuthenticated: req.session.isLoggedIn,
  });
};

exports.postLogin = (req, res, next) => {
  User.findById("6307db3822c8b724936fda41")
    .then((user) => {
      // res.setHeader("Set-Cookie", "loggedIn=true"); -> this sets cookie
      req.session.isLoggedIn = true;
      req.session.user = user;
      req.session.save((err) => { //making sure session data is stored before we redirect because sometimes storing might take few mS to complete , but
        //render would have been complete, that time you won't see changes and have to reload the page.
        console.log(err);
        res.redirect("/");
      });
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
