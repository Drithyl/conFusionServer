var express = require('express');
const bodyParser = require("body-parser");
const User = require("../models/user");
const passport = require("passport");
const authenticate = require("../authenticate");

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.route("/")
//Only admins can retrieve the list of existing users
.get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  User.find({})
  .then((users) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(users);

  }, (err) => next(err))
  .catch((err) => next(err));
});

//endpoint to sign up new users into the system
router.post("/signup", (req, res, next) =>
{
  //method provided by passport-local-mongoose
  User.register(new User({ username: req.body.username }), req.body.password, (err, user) =>
  {
    if (err)
    {
      res.statusCode = 500;
      res.setHeader(`Content-Type`, `application/json`);
      res.json({err: err});
    }

    else
    {
      //add the user firstname and lastname if contained in the body of the
      //signup request, and then save these modifications
      if (req.body.firstname)
      {
        user.firstname = req.body.firstname;
      }

      if  (req.body.lastname)
      {
        user.lastname = req.body.lastname;
      }

      user.save((err, user) =>
      {
        if (err)
        {
          res.statusCode = 500;
          res.setHeader(`Content-Type`, `application/json`);
          res.json({err: err});
          return;
        }

        passport.authenticate("local")(req, res, () =>
        {
          res.statusCode = 200;
          res.setHeader(`Content-Type`, `application/json`);
          res.json({sucess: true, status: `Registration Successful!`});
        });
      });
    }
  });
});

//if using JWT, we will create a token here for the user to include in all
//future requests once they are logged in. The passport authenticate will
//load the user object onto the req object, containing the user information
//from our User model. Must add the created token onto the body of our response object
router.post(`/login`, passport.authenticate("local"), (req, res) =>
{
  let token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader(`Content-Type`, `application/json`);
  res.json({sucess: true, token: token, status: `You are successfully logged in!`});
});

//no need to use a post because to log out the server already has the information
router.get("/logout", (req, res) =>
{
  if (req.session != null)
  {
    req.session.destroy();

    //asks the client to remove the cookie named session-id, which we created
    //earlier in app.js when using the express-sessions middleware
    res.clearCookie("session-id");

    //Redirects user to another page, in this case the homepage
    res.redirect("/");
  }

  else
  {
    var err = new Error("You are not logged in!");
    err.status = 403; //Forbidden operation
    next(err);
  }
});

module.exports = router;
