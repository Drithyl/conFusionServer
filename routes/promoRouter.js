const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

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
.post((req, res, next) =>
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
.put((req, res, next) =>
{
  //operation not supported, put only makes sense to specific promos, not on the
  // /promotions endpoint
  res.statusCode = 403;
  res.end(`PUT operation not supported on /promotions`);
})
.delete((req, res, next) =>
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

promoRouter.route(`/:promotionId`)
.get((req, res, next) =>
{
  //extract the promotionId through the params property of the request
  Promotions.findById(req.params.promotionId)
  .then((promotion) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(promotion);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post((req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /promotions/${req.params.promotionId}`);
})
.put((req, res, next) =>
{
  Promotions.findByIdAndUpdate(req.params.promotionId,
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
.delete((req, res, next) =>
{
  Promotions.findByIdAndRemove(req.params.promotionId)
  .then((resp) =>
  {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));
});

module.exports = promoRouter;
