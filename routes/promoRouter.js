const express = require("express");
const bodyParser = require("body-parser");

const promoRouter = express.Router();

promoRouter.use(bodyParser.json());

//this does not use the `/promos` endpoint anymore because that will be
//mounted on the express router in the main index.js file

//.route() means we are declaring the endpoint in one single location, so
//we can handle all the HTTP requests here. Notice we don't use app.all()
//anymore but instead mount .all into the promoRouter route. We will also
//chain all the rest of the requests.
promoRouter.route(`/`)
.all((req, res, next) =>
{
  res.statusCode = 200;
  res.setHeader(`Content-Type`, `text/plain`);

  //next will pass on the req and res to the next HTTP requests involving
  //the resource /promos, like the ones defined below
  next();
})
.get((req, res, next) =>
{
  //req and res contain the modifications made earlier in the app.all(),
  //due to the next() call in the app.all()
  res.end(`Will send all the promos to you!`);
})
.post((req, res, next) =>
{
  res.end(`Will add the promo: ${req.body.name} with details: ${req.body.description}`);
})
.put((req, res, next) =>
{
  //operation not supported, put only makes sense to specific promoes, not on the
  // /promos endpoint
  res.statusCode = 403;
  res.end(`PUT operation not supported on /promos`);
})
.delete((req, res, next) =>
{
  res.end(`Deleting all the promos!`);
});

promoRouter.route(`/:promoId`)
.all((req, res, next) =>
{
  res.statusCode = 200;
  res.setHeader(`Content-Type`, `text/plain`);

  //next will pass on the req and res to the next HTTP requests involving
  //the resource /promos, like the ones defined below
  next();
})
.get((req, res, next) =>
{
  res.end(`Will send details of the promo: ${req.params.promoId} to you!`);
})
.post((req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /promos/${req.params.promoId}`);
})
.put((req, res, next) =>
{
  res.write(`Updating the promo: ${req.params.promoId}\n`);
  res.end(`Will update the promo : ${req.body.name} with details ${req.body.description}`);
})
.delete((req, res, next) =>
{
  res.end(`Deleting promo: ${req.params.promoId}`);
});

module.exports = promoRouter;
