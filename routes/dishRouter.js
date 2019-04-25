const express = require("express");
const bodyParser = require("body-parser");

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

//this does not use the `/dishes` endpoint anymore because that will be
//mounted on the express router in the main index.js file

//.route() means we are declaring the endpoint in one single location, so
//we can handle all the HTTP requests here. Notice we don't use app.all()
//anymore but instead mount .all into the dishRouter route. We will also
//chain all the rest of the requests.
dishRouter.route(`/`)
.all((req, res, next) =>
{
  res.statusCode = 200;
  res.setHeader(`Content-Type`, `text/plain`);

  //next will pass on the req and res to the next HTTP requests involving
  //the resource /dishes, like the ones defined below
  next();
})
.get((req, res, next) =>
{
  //req and res contain the modifications made earlier in the app.all(),
  //due to the next() call in the app.all()
  res.end(`Will send all the dishes to you!`);
})
.post((req, res, next) =>
{
  res.end(`Will add the dish: ${req.body.name} with details: ${req.body.description}`);
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
  res.end(`Deleting all the dishes!`);
});

dishRouter.route(`/:dishId`)
.all((req, res, next) =>
{
  res.statusCode = 200;
  res.setHeader(`Content-Type`, `text/plain`);

  //next will pass on the req and res to the next HTTP requests involving
  //the resource /dishes, like the ones defined below
  next();
})
.get((req, res, next) =>
{
  res.end(`Will send details of the dish: ${req.params.dishId} to you!`);
})
.post((req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /dishes/${req.params.dishId}`);
})
.put((req, res, next) =>
{
  res.write(`Updating the dish: ${req.params.dishId}\n`);
  res.end(`Will update the dish : ${req.body.name} with details ${req.body.description}`);
})
.delete((req, res, next) =>
{
  res.end(`Deleting dish: ${req.params.dishId}`);
});

module.exports = dishRouter;
