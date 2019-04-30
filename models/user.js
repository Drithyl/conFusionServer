const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

//username and password fields for the schema are 
//automatically added by passportLocalMongoose
const User = new Schema({

  admin: {
    type: Boolean,
    default: false
  }
});

//add additional methods on the User
User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
