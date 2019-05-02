const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate.js");
const Leaders = require("../models/leaders.js");

const leaderRouter = express.Router();

leaderRouter.use(bodyParser.json());

leaderRouter.route(`/`)
.get((req, res, next) =>
{
  Leaders.find({})
  .then((leaders) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    //will take a JSON string and put it in the body of the response
    res.json(leaders);

    //pass the errors that occurr to the general error handler using next()
    //Recall that next() will trickle down values below
  }, (err) => next(err))
  .catch((err) => next(err));
})
//before running the (req, res, next) callback we can run the verifyUser
//function to authenticate the user's web token. If it fails, Passport will
//itself respond with an error to the user
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //pass the data we receive in the request body as the data to create a new leader
  Leaders.create(req.body)
  .then((leader) =>
  {
    console.log(`Leader Created `, leader);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(leader);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //operation not supported, put only makes sense to specific promos, not on the
  // /Leaderdpoint
  res.statusCode = 403;
  res.end(`PUT operation not supported on /leaders`);
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //Dangerous operation, as it removes all promos from the database
  Leaders.remove({})
  .then((resp) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));
});

leaderRouter.route(`/:leaderId`)
.get((req, res, next) =>
{
  //extract the leaderId through the params property of the request
  Leaders.findById(req.params.leaderId)
  .then((leader) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(leader);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /leaders/${req.params.leaderId}`);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  Leaders.findByIdAndUpdate(req.params.leaderId,
  {
    $set: req.body
  },
  {
    new: true
  })
  .then((leader) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(leader);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  Leaders.findByIdAndRemove(req.params.leaderId)
  .then((resp) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));
});

module.exports = leaderRouter;
