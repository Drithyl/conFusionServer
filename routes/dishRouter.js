const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate.js");

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
//before running the (req, res, next) callback we can run the verifyUser
//function to authenticate the user's web token. If it fails, Passport will
//itself respond with an error to the user
.post(authenticate.verifyUser, (req, res, next) =>
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
.put(authenticate.verifyUser, (req, res, next) =>
{
  //operation not supported, put only makes sense to specific dishes, not on the
  // /dishes endpoint
  res.statusCode = 403;
  res.end(`PUT operation not supported on /dishes`);
})
.delete(authenticate.verifyUser, (req, res, next) =>
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
.post(authenticate.verifyUser, (req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /dishes/${req.params.dishId}`);
})
.put(authenticate.verifyUser, (req, res, next) =>
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
.delete(authenticate.verifyUser, (req, res, next) =>
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


dishRouter.route(`/:dishId/comments`)
.get((req, res, next) =>
{
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    if (dish != null)
    {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(dish.comments);
    }

    else
    {
      err = new Error(`Dish ${req.params.dishId} not found`);
      err.status = 404; //not found
      return next(err); //handled by app.js file at the bottom
    }

  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) =>
{
  //pass the data we receive in the request body as the data to create a new dish
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    if (dish != null)
    {
      //push the comments that need to be posted
      dish.comments.push(req.body);

      //if save is successful, return the updated dish
      dish.save()
      .then((dish) =>
      {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dish);
      }, (err) => next(err));

    }

    else
    {
      err = new Error(`Dish ${req.params.dishId} not found`);
      err.status = 404; //not found
      return next(err); //handled by app.js file at the bottom
    }

  }, (err) => next(err))
  .catch((err) => next(err));
})
.put(authenticate.verifyUser, (req, res, next) =>
{
  res.statusCode = 403;
  res.end(`PUT operation not supported on /dishes/${req.params.dishId}/comments`);
})
.delete(authenticate.verifyUser, (req, res, next) =>
{
  //Dangerous operation, as it removes all dishes from the database
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    if (dish != null)
    {
      //loop backwards to remove all comments (cannot loop forwards or the
      //indexes change as we delete)
      for (var i = (dish.comments.length -1); i >= 0; i--)
      {
        //.id() is a mongoose function to fetch a subdocument by id
        //then we can call remove() on the returned document
        dish.comments.id(dish.comments[i]._id).remove();
      }

      //if save is successful, return the updated dish
      dish.save()
      .then((dish) =>
      {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dish);
      }, (err) => next(err));
    }

    else
    {
      err = new Error(`Dish ${req.params.dishId} not found`);
      err.status = 404; //not found
      return next(err); //handled by app.js file at the bottom
    }

  }, (err) => next(err))
  .catch((err) => next(err));
});

dishRouter.route(`/:dishId/comments/:commentId`)
.get((req, res, next) =>
{
  //extract the dishId through the params property of the request
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    //need to check both for the dish and the comment existing
    if (dish != null && dish.comments.id(req.params.commentId) != null)
    {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(dish.comments.id(req.params.commentId));
    }

    else if (dish == null)
    {
      err = new Error(`Dish ${req.params.dishId} not found`);
      err.status = 404;
      return next(err); //handled by app.js file at the bottom
    }

    else
    {
      err = new Error(`Comment ${req.params.commentId} not found`);
      err.status = 404;
      return next(err); //handled by app.js file at the bottom
    }

  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /dishes/${req.params.dishId}/comments/${req.params.commentId}`);
})
.put(authenticate.verifyUser, (req, res, next) =>
{
  //extract the dishId through the params property of the request
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    //need to check both for the dish and the comment existing
    if (dish != null && dish.comments.id(req.params.commentId) != null)
    {
      //only allow users to change the rating and the comment of a
      //comment document, not the author or other fields
      //This seems to be the only easy way to update a subdocument directly
      //in mongoose. There is no explicit way of doing so otherwise
      //(unlike how we were doing it to update the dish itself)
      if (req.body.rating)
      {
        dish.comments.id(req.params.commentId).rating = req.body.rating;
      }

      if (req.body.comment)
      {
        dish.comments.id(req.params.commentId).comment = req.body.comment;
      }

      //if save is successful, return the updated dish
      dish.save()
      .then((dish) =>
      {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dish);
      }, (err) => next(err));
    }

    else if (dish == null)
    {
      err = new Error(`Dish ${req.params.dishId} not found`);
      err.status = 404;
      return next(err); //handled by app.js file at the bottom
    }

    else
    {
      err = new Error(`Comment ${req.params.commentId} not found`);
      err.status = 404;
      return next(err); //handled by app.js file at the bottom
    }

  }, (err) => next(err))
  .catch((err) => next(err));
})
//should only be allowed for the user who posted the comment to delete it,
//but for now we are sticking to a basic model
.delete(authenticate.verifyUser, (req, res, next) =>
{
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    if (dish != null && dish.comments.id(req.params.commentId) != null)
    {
      dish.comments.id(req.params.commentId).remove();

      //if save is successful, return the updated dish
      dish.save()
      .then((dish) =>
      {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dish);
      }, (err) => next(err));
    }

    else if (dish == null)
    {
      err = new Error(`Dish ${req.params.dishId} not found`);
      err.status = 404;
      return next(err); //handled by app.js file at the bottom
    }

    else
    {
      err = new Error(`Comment ${req.params.commentId} not found`);
      err.status = 404;
      return next(err); //handled by app.js file at the bottom
    }

  }, (err) => next(err))
  .catch((err) => next(err));
});

module.exports = dishRouter;
