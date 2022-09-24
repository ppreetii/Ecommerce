const bcrypt = require("bcryptjs");

const User = require("../../models/mongoose/user");

exports.getLogin = (req, res, next) => {
  let message = req.flash('error')
  message = message.length > 0 ? message[0] : null;

  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        req.flash('error',"Invalid Email")
        return res.redirect('/login');
      }

      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          //doMatch = true/false
          if (doMatch) {
            // res.setHeader("Set-Cookie", "loggedIn=true"); -> this sets cookie
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {  //return is necessary to not go to res redirect line outside if block
              //making sure session data is stored before we redirect because sometimes storing might take few mS to complete , but
              //render would have been complete, that time you won't see changes and have to reload the page.
              console.log(err);
              res.redirect("/");
            });
          }
          req.flash('error',"Incorrect Password")
          res.redirect("/login");
        })
        .catch((err) => console.log(err)); //only executes if something went wrong with bcrypt and not when pswds do not match
    })
    .catch((err) => console.log(err));
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error')
  message = message.length > 0 ? message[0] : null;

  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    errorMessage : message
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({ email })
    .then((userDoc) => {
      if (userDoc){ 
        req.flash('error','Email already exists')
        return res.redirect("/signup");
      }
      if(password !== confirmPassword){
        req.flash('error','Password mistmatch')
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
