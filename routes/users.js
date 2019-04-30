var express = require('express');
const bodyParser = require("body-parser");
const User = require("../models/user");
const passport = require("passport");

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

//endpoint to sign up new users into the system
router.post("/signup", (req, res, next) =>
{
  //method provided by passport-local-mongoose
  User.register(new User({ username: req.body.username }), req.body.password, (err, user) =>
  {
    if (err)
    {
      res.statusCode = 200;
      res.setHeader(`Content-Type`, `application/json`);
      res.json({err: err});
    }

    else
    {
      passport.authenticate("local")(req, res, () =>
      {
        res.statusCode = 200;
        res.setHeader(`Content-Type`, `application/json`);
        res.json({sucess: true, status: `Registration Successful!`});
      });
    }
  });
});

//if there is any error in the passport.authenticate() function,
//the final callback below (req, res, next) does not get executed.
//passport handles those errors for us thanks to the authenticate.js
//file we created, in which we specified the auth strategy
//thus we do not need to handle those cases here;
//only consider that login was successful
//when it is successful, the passport.authenticate("local") will add the
//user property to the request message (req.user), see in app.js
//when a client request comes with the session in place, passport
//handles it as well by including it to the req object
router.post(`/login`, passport.authenticate("local"), (req, res, next) =>
{
  res.statusCode = 200;
  res.setHeader(`Content-Type`, `application/json`);
  res.json({sucess: true, status: `You are successfully logged in!`});
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
