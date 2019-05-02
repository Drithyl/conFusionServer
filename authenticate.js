const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");

//passport-jwt provides the strategy required to deal with JSON Web Token (JWT)
//based authentication, along with methods to extract them and verify them
//from the incoming HTTP requests
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");

const config = require("./config.js");

//passport-local-mongoose provides a user authenticate() function
//if not using it, we must write our own like was done in other examples
exports.local = passport.use(new LocalStrategy(User.authenticate()));

//if we are using express-sessions we must provide methods
//to serialize and deserialize the user to store its data
//these are provided here by passport-local-mongoose
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//function to create a token for an authenticated user to use in all following requests
//user is the payload (data) that the token will include inside it and we should
//at least include the _id of the user in it
exports.getToken = function(user)
{
  //expiresIn is express in seconds, after which the token has to be regenerated.
  return jwt.sign(user, config.secretKey, {expiresIn: 3600});
};

//options of the JwtStrategy to extract the JWT
const opts = {};

//Specifies how the JWT should be extracted from the incoming request:
//fromAuthHeader, fromBodyField, fromExtractors, etc. Check docs.
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

//The new JwtStrategy used takes an options object and a verify callback
//function that validates incoming JWTs, which receives the payload of the JWT
//as an argument. "done" is the callback that passport requires, through which
//we will be passing information to it which it will use to load things into the request
exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payLoad, done) =>
{
  console.log("JWT payload:\n\n", jwt_payLoad);

  //the ._id field contains the user id within the JWT, which we can use
  //to fetch the user from the database. This is a standard mongoose method.
  User.findOne({_id: jwt_payLoad._id}, (err, user) =>
  {
    if (err)
    {
      //takes an error, a user:any and additionalInfo:any. If we pass false as
      //second parameter it will interpret that the user does not exist.
      return done(err, false);
    }

    else if (user != null)
    {
      return done(null, user);
    }

    //could create a new user account here but we're keeping it simple
    else return done(null, false);
  });
}));

//we'll use the jwt strategy which we just configured to authenticate users
//we will also not create sessions as that violates the stateless principle of
//REST and is not very scalable. JWTs make up for this.

//The jwt strategy for authentication will extract the token from the
//authentication header of the incoming request, as we configured above in
//the opts.jwtFromRequest above. Anytime we need to verify the user in the request
//we cam call this function. If it is successful, we can proceed.
exports.verifyUser = passport.authenticate("jwt", {session: false});
