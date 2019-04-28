var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dishRouter = require('./routes/dishRouter.js');
var promoRouter = require('./routes/promoRouter.js');
var leaderRouter = require('./routes/leaderRouter.js');

const mongoose = require("mongoose");

const Dishes = require("./models/dishes.js");

const url = "mongodb://localhost:27017/conFusion";
const connect = mongoose.connect(url);

connect.then((db) =>
{
  console.log(`Connected correctly to database`);
})
.catch((err) => console.log("ERROR ERROR ERROR", err));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//authorization middleware
function auth(req, res, next)
{
  console.log(req.headers);

  //grabs authorization header sent by client
  let authHeader = req.headers.authorization;

  //username and password were not included
  if (authHeader == null)
  {
    let err = new Error(`You are not authenticated!`);

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
  let auth = new Buffer(authHeader.split(` `)[1], `base64`).toString().split(`:`);
  let username = auth[0];
  let password = auth[1];

  if (username === "admin" && password === "password")
  {
    //allow user to pass down to the next middleware to service the request
    next();
  }

  else
  {
    let err = new Error(`You are not authenticated!`);

    res.setHeader(`WWW-Authenticate`, `Basic`);
    err.status = 401; //Unauthorized access code

    //skip all other middlewares below and send error since client is not authenticated
    return next(err);
  }
}

app.use(auth);

//enables us to serve static data from our public resources
//authentication should come before this
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
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
