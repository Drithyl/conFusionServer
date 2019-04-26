const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//will load the new type currency into mongoose so we can access
//it as seen in the next line
require("mongoose-currency").loadType(mongoose);
const Currency = mongoose.Types.Currency;

const commentSchema = new Schema(
{
  rating:
  {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  comment:
  {
    type: String,
    required: true
  },

  author:
  {
    type: String,
    required: true
  }
},
{
  timestamps: true
});

const dishSchema = new Schema(
{
  name:
  {
    type: String,
    required: true,
    unique: true
  },

  description:
  {
    type: String,
    required: true
  },

  image:
  {
    type: String,
    required: true
  },

  category:
  {
    type: String,
    required: true
  },

  label:
  {
    type: String,
    default: ""
  },

  price:
  {
    type: Currency,
    required: true,
    min: 0
  },

  featured:
  {
    type: Boolean,
    default: false
  },

  //an array of comment schemas, this is an array of documents inside a document
  comments: [ commentSchema ]
},
{
  //Schema options
  timestamps: true
});

//Mongoose automatically pluralizes English words to name model collections
//in the database, so whenever we use a model called "Dish" and save it,
//it'll get saved in the collection "Dishes"
var Dishes = mongoose.model("Dish", dishSchema);

module.exports = Dishes;
