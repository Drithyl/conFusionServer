
/**************************************
*   THIS IS A SCAFFOLDED EXPRESS APP  *
**************************************/

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require(`express-session`);

//required to keep the express session stored in a database
//or other persistent storage. Creates a /sessions directory
//with a .json file for the session stored
const FileStore = require(`session-file-store`)(session);
const passport = require("passport");
const authenticate = require("./authenticate.js");
const config = require("./config.js");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dishRouter = require('./routes/dishRouter.js');
var promoRouter = require('./routes/promoRouter.js');
var leaderRouter = require('./routes/leaderRouter.js');

const mongoose = require("mongoose");

const Dishes = require("./models/dishes.js");

const url = config.mongoUrl;
const connect = mongoose.connect(url);

connect.then((db) =>
{
  console.log(`Connected correctly to database`);
})
.catch((err) => console.log("ERROR ERROR ERROR", err));

var app = express();

//"all" requests coming in will be redirected to the secure server (* is a wildcard)
app.all("*", (req, res, next) =>
{
  //requests that already go through the secure server will have the .secure flag
  if (req.secure === true)
  {
    return next();
  }

  console.log("Request received at HTTP, redirecting to HTTPS...");

  //redirect method lets us redirect a request to a different URL, using the
  //hostname flag already present in the req object (since we're redirecting to
  //the same host, just different port). req.url contains the actual path on
  //the server that the request was being sent to. 307 is the code that indicates
  //that the resources that the client required was moved to a different location
  //(the secure server)
  res.redirect(307, `https://${req.hostname}:${app.get("secPort")}${req.url}`);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//this middleware will handle the authentication and the session if existing
app.use(passport.initialize());

//These endpoints must be before the rest for authentication
app.use('/', indexRouter);
app.use('/users', usersRouter);

//enables us to serve static data from our public resources
//We will only require authentication for PUT, POST and DELETE operations
app.use(express.static(path.join(__dirname, 'public')));

app.use('/dishes', dishRouter);
app.use('/promotions', promoRouter);
app.use('/leaders', leaderRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // catches errors and sets the status given to the error
  // then returns it to the client
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
