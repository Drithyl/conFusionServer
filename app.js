
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

//Pass a string to use as a secret key for signed cookies
//app.use(cookieParser(`12345-67890-09876-54321`));

//create a session with the express-sessions middleware
app.use(session({
  name: `session-id`,
  secret: `12345-67890-09876-54321`,
  saveUnitialized: false,
  resave: false,
  store: new FileStore()
}));

//this middleware will handle the authentication and the session if existing
app.use(passport.initialize());
app.use(passport.session());

//These endpoints must be before the rest for authentication
app.use('/', indexRouter);
app.use('/users', usersRouter);

//authorization middleware
function auth(req, res, next)
{
  console.log(`List of headers included in the request:\n\n`, req.headers);
  console.log(`Signed Cookies included:\n\n`, req.signedCookies);
  console.log(`Session data included:\n\n`, req.session);

  //req.user is loaded in by the passport middleware
  if (req.user == null)
  {
    let err = new Error(`You are not authenticated!`);
    err.status = 403;

    //skip all other middlewares below and send error since client is not authenticated
    return next(err);
  }

  //if req.user is present then passport has done authentication and so we can continue
  else
  {
    next();
  }
}

app.use(auth);

//enables us to serve static data from our public resources
//authentication should come before this
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
