
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//create favorited dishes as their own schema to be able to add them as an array
//of ObjectId references to the favoriteSchema model
const favoriteDishSchema = new Schema(
{
  _id:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dish"
  }
},
{
  timestamps: true
});

const favoriteSchema = new Schema(
{
  user:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  dishes: [ favoriteDishSchema ]
},
{
  //Schema options
  timestamps: true
});

var Favorites = mongoose.model("Favorites", favoriteSchema);

module.exports = Favorites;
