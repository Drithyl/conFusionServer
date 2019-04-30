const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");

//passport-local-mongoose provides a user authenticate() function
//if not using it, we must write our own like was done in other examples
exports.local = passport.use(new LocalStrategy(User.authenticate()));

//since we are using express-sessions we must provide methods
//to serialize and deserialize the user to store its data
//these are provided here by passport-local-mongoose
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());