const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate.js");
const Promotions = require("../models/promotions.js");

const promoRouter = express.Router();

promoRouter.use(bodyParser.json());

promoRouter.route(`/`)
.get((req, res, next) =>
{
  Promotions.find({})
  .then((promotions) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    //will take a JSON string and put it in the body of the response
    res.json(promotions);

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
  //pass the data we receive in the request body as the data to create a new promotion
  Promotions.create(req.body)
  .then((promotion) =>
  {
    console.log(`Promotion Created `, promotion);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(promotion);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //operation not supported, put only makes sense to specific promos, not on the
  // /promotions endpoint
  res.statusCode = 403;
  res.end(`PUT operation not supported on /promotions`);
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //Dangerous operation, as it removes all promos from the database
  Promotions.remove({})
  .then((resp) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));
});

promoRouter.route(`/:promoId`)
.get((req, res, next) =>
{
  //extract the promoId through the params property of the request
  Promotions.findById(req.params.promoId)
  .then((promotion) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(promotion);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /promotions/${req.params.promoId}`);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  Promotions.findByIdAndUpdate(req.params.promoId,
  {
    $set: req.body
  },
  {
    new: true
  })
  .then((promotion) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(promotion);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  Promotions.findByIdAndRemove(req.params.promoId)
  .then((resp) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));
});

module.exports = promoRouter;
