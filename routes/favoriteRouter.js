const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate.js");
const cors = require("./cors.js");

const Favorites = require("../models/favorite.js");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route(`/`)
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  //find only the stored favorites of the user id doing the request
  Favorites.findOne({user: req.user._id})
  .populate("user")
  //populate the dishes array stored in the favoriteSchema by using
  //the dish _id property of each item
  .populate("dishes")
  .then((favorites) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(favorites);

  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  Favorites.findOne({user: req.user._id})
  .then((favorites) =>
  {
    //user did not send an array, so can't create or update favorites properly
    if (Array.isArray(req.body) === false)
    {
      err = new Error(`Request's body must be an array of dish ids.`);
      err.status = 400; //client error
      return next(err);
    }

    //favorites don't exist, so create them with the dishes received
    if (favorites == null)
    {
      Favorites.create({user: req.user._id, dishes: req.body})
      .then((createdFavorites) =>
      {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(createdFavorites);

      }, (err) => next(err));
    }

    //favorites exist, add the dishes sent by user
    else
    {
      //filter the received array of dishes so that if one exists already in
      //favorites.dishes, it will not be kept
      let uniqueArray = req.body.filter((dish) =>
      {
        return favorites.dishes.find((existingDish) => existingDish.equals(dish._id)) == null;
      });

      //update the existing favorites by concatenating the existing dishes
      //array with the unique array we worked out above
      favorites.dishes = favorites.dishes.concat(uniqueArray);

      favorites.save()
      .then((updatedFavorites) =>
      {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(updatedFavorites);
      }, (err) => next(err));
    }
  })
  .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  res.statusCode = 403;
  res.end(`PUT operation not supported on /favorites`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  //Will find the favorites with this user ID and delete it
  Favorites.remove({user: req.user._id})
  .then((resp) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));
});

favoriteRouter.route(`/:dishId`)
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  res.statusCode = 403;
  res.end(`GET operation not supported on /favorites/${req.params.dishId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  Favorites.findOne({user: req.user._id})
  .then((favorites) =>
  {
    //favorites don't exist, so create them with the dish received
    if (favorites == null)
    {
      Favorites.create({user: req.user._id, dishes: [req.params.dishId]})
      .then((createdFavorites) =>
      {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(createdFavorites);

      }, (err) => next(err));
    }

    //favorites exist, add dish
    else
    {
      //dish already exists in favorites, don't add it again
      if (favorites.dishes.indexOf(req.params.dishId) !== -1)
      {
        err = new Error(`Dish already exists in your favorites!`);
        err.status = 400; //client error
        return next(err);
      }

      //update the existing favorites by pushing the id provided by the user
      favorites.dishes.push(req.params.dishId);

      favorites.save()
      .then((updatedFavorites) =>
      {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(updatedFavorites);
      }, (err) => next(err));
    }
  })
  .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  res.statusCode = 403;
  res.end(`PUT operation not supported on /dishes/${req.params.dishId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  Favorites.findOne({user: req.user._id})
  .then((favorites) =>
  {
    //find the dishes with the same _id as the one submitted and remove them
    //from our dishes array; this will also remove potential duplicates
    //loop must be done backwards or otherwise deleted indexes change the loop order
    for (var i = favorites.dishes.length-1; i >= 0; i--)
    {
      if (favorites.dishes[i].equals(req.params.dishId) === true)
      {
        favorites.dishes.splice(i, 1);
      }
    }

    favorites.save()
    .then((updatedFavorites) =>
    {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(updatedFavorites);
    }, (err) => next(err))
    .catch((err) => next(err));

  }, (err) => next(err))
  .catch((err) => next(err));
});

module.exports = favoriteRouter;
