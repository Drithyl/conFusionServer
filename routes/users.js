var express = require('express');
const bodyParser = require("body-parser");
const User = require("../models/user");

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

//endpoint to sign up new users into the system
router.post("/signup", (req, res, next) =>
{
  //access the database to check if the username trying to sign up exists already
  User.findOne({username: req.body.username})
  .then((user) =>
  {
    //user already exists
    if (user != null)
    {
      let err =  new Error(`User ${req.body.username} already exists!`);
      err.status = 403;
      next(err);
    }

    else
    {
      return User.create({
        username: req.body.username,
        password: req.body.password
      });
    }
  })
  //only executes when a promise is returned, i.e. the one above when the User
  //gets created
  .then((user) =>
  {
    res.statusCode = 200;
    res.setHeader(`Content-Type`, `application/json`);
    res.json({status: `Registration Successful!`, user: user});
  }, (err) => next(err))
  .catch((err) => next(err));
});

router.post(`/login`, (req, res, next) =>
{
  //If the incoming request has no user field in the session
  //(as declared further below),
  //it will mean that the user has not been authorized yet, so we will
  //expect him to sign in
  if (req.session.user == null)
  {
    //grabs authorization header sent by client
    let authHeader = req.headers.authorization;

    //username and password were not included
    if (authHeader == null)
    {
      let err = new Error(`You are not authenticated!`);

      //Including this header in the response will prompt the user to authorize himself
      res.setHeader(`WWW-Authenticate`, `Basic`);
      err.status = 401; //Unauthorized access code

      //skip all other middlewares below and send error since client is not authenticated
      return next(err);
    }

    //header contais "Basic username:password", so we split by a space
    //and keep only the username:password bit, which is encoded in base64,
    //so we convert it into a buffer with that encoding and then back to string
    //so that it is readable. Next we split by ":" to get an array containing
    //username and password
    let auth = new Buffer.from(authHeader.split(` `)[1], `base64`).toString().split(`:`);
    let username = auth[0];
    let password = auth[1];

    User.findOne({username: username})
    .then((user) =>
    {
      if (user == null)
      {
        let err = new Error(`User ${username} does not exist!`);
        err.status = 403;
        return next(err);
      }

      else if (user.password !== password)
      {
        let err = new Error(`Your password is incorrect!`);
        err.status = 403;
        return next(err);
      }

      else if (user.username === username && user.password === password)
      {
        req.session.user = `authenticated`;
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("You are authenticated!");
      }
    })
    .catch((err) => next(err));
  }

  else
  {
    res.statusCode = 200;
    res.setHeader("Content-type", "text/plain");
    res.end("You are already authenticated!");
  }
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
