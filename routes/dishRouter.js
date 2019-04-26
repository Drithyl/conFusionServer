const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const Dishes = require("../models/dishes.js");

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

//this does not use the `/dishes` endpoint anymore because that will be
//mounted on the express router in the main index.js file

//.route() means we are declaring the endpoint in one single location, so
//we can handle all the HTTP requests here. Notice we don't use app.all()
//anymore but instead mount .all into the dishRouter route. We will also
//chain all the rest of the requests.
dishRouter.route(`/`)
.get((req, res, next) =>
{
  Dishes.find({})
  .then((dishes) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    //will take a JSON string and put it in the body of the response
    res.json(dishes);

    //pass the errors that occurr to the general error handler using next()
    //Recall that next() will trickle down values below
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post((req, res, next) =>
{
  //pass the data we receive in the request body as the data to create a new dish
  Dishes.create(req.body)
  .then((dish) =>
  {
    console.log(`Dish Created `, dish);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(dish);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.put((req, res, next) =>
{
  //operation not supported, put only makes sense to specific dishes, not on the
  // /dishes endpoint
  res.statusCode = 403;
  res.end(`PUT operation not supported on /dishes`);
})
.delete((req, res, next) =>
{
  //Dangerous operation, as it removes all dishes from the database
  Dishes.remove({})
  .then((resp) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));
});

dishRouter.route(`/:dishId`)
.get((req, res, next) =>
{
  //extract the dishId through the params property of the request
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(dish);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post((req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /dishes/${req.params.dishId}`);
})
.put((req, res, next) =>
{
  Dishes.findByIdAndUpdate(req.params.dishId,
  {
    $set: req.body
  },
  {
    new: true
  })
  .then((dish) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(dish);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.delete((req, res, next) =>
{
  Dishes.findByIdAndRemove(req.params.dishId)
  .then((resp) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));
});

module.exports = dishRouter;
