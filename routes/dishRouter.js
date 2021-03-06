const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate.js");
const cors = require("./cors.js");

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
//if clients do a preflighted request, it will send the HTTP OPTIONS req message
//and expect a reply from the server before sending an actual request for a resource
//here is where we will handle that through the corsWithOptions that we defined
//within the cors.js file in /routes.
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
//GET requests will use the optionless cors we set up what will accept any origin
.get(cors.cors, (req, res, next) =>
{
  Dishes.find({})
  //will fetch the references to the User documents in the comment
  //this is a very expensive operation so it should be used judiciously
  .populate("comments.author")
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
//Will check origin of request to allow only certain origins
.post(cors.corsWithOptions,
  //before running the (req, res, next) callback we can run the verifyUser
  //function to authenticate the user's web token. If it fails, Passport will
  //itself respond with an error to the user. We can also run the verifyAdmin
  //function right after to check for admin privileges too, since only admins
  //can post, put or delete dishes/promos/leaders
  authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
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
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //operation not supported, put only makes sense to specific dishes, not on the
  // /dishes endpoint
  res.statusCode = 403;
  res.end(`PUT operation not supported on /dishes`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
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
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) =>
{
  //extract the dishId through the params property of the request
  Dishes.findById(req.params.dishId)
  .populate("comments.author")
  .then((dish) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(dish);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /dishes/${req.params.dishId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
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
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
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
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) =>
{
  Dishes.findById(req.params.dishId)
  .populate("comments.author")
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
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  //pass the data we receive in the request body as the data to create a new dish
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    if (dish != null)
    {
      //we obtain user information because passport is doing authentication
      //above in authenticate.verifyUser, which loads the user info into the
      //request, in req.user. When the comment comes in from the client it will
      //only contain the comment field and the rating field (since we don't)
      //want to let the client explicity add the author field
      req.body.author = req.user._id;

      //push the comments that need to be posted
      dish.comments.push(req.body);

      //if save is successful, return the updated dish
      dish.save()
      .then((dish) =>
      {
        //need to populate the author information that we filled server-side
        //above into the result that we send back to the client, so that the
        //comments will show with their authors too
        Dishes.findById(dish._id)
        .populate("comments.author")
        .then((dish) =>
        {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(dish);
        });

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
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  res.statusCode = 403;
  res.end(`PUT operation not supported on /dishes/${req.params.dishId}/comments`);
})
//only admins can delete all comments in one stroke
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
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
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) =>
{
  //extract the dishId through the params property of the request
  Dishes.findById(req.params.dishId)
  .populate("comments.author")
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
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /dishes/${req.params.dishId}/comments/${req.params.commentId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  //extract the dishId through the params property of the request
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    //need to check both for the dish and the comment existing
    if (dish != null && dish.comments.id(req.params.commentId) != null)
    {
      //make sure that the user updating the comment is the same as the one
      //that posted the comment in the first place
      if (req.user._id.equals(dish.comments.id(req.params.commentId).author) === false)
      {
        let err = new Error(`You are not authorized to update this comment!`);
        err.status = 403;
        return next(err);
      }

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
        Dishes.findById(dish._id)
        .populate("comments.author")
        .then((dish) =>
        {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(dish);
        });

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
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
{
  Dishes.findById(req.params.dishId)
  .then((dish) =>
  {
    if (dish != null && dish.comments.id(req.params.commentId) != null)
    {
      //make sure that the user deleting the comment is the same as the one
      //that posted the comment in the first place
      if (req.user._id.equals(dish.comments.id(req.params.commentId).author) === false)
      {
        let err = new Error(`You are not authorized to delete this comment!`);
        err.status = 403;
        return next(err);
      }

      dish.comments.id(req.params.commentId).remove();

      //if save is successful, return the updated dish
      dish.save()
      .then((dish) =>
      {
        Dishes.findById(dish._id)
        .populate("comments.author")
        .then((dish) =>
        {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(dish);
        });
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
