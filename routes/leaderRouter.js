const express = require("express");
const bodyParser = require("body-parser");

const leaderRouter = express.Router();

leaderRouter.use(bodyParser.json());

//this does not use the `/leaders` endpoint anymore because that will be
//mounted on the express router in the main index.js file

//.route() means we are declaring the endpoint in one single location, so
//we can handle all the HTTP requests here. Notice we don't use app.all()
//anymore but instead mount .all into the leaderRouter route. We will also
//chain all the rest of the requests.
leaderRouter.route(`/`)
.all((req, res, next) =>
{
  res.statusCode = 200;
  res.setHeader(`Content-Type`, `text/plain`);

  //next will pass on the req and res to the next HTTP requests involving
  //the resource /leaders, like the ones defined below
  next();
})
.get((req, res, next) =>
{
  //req and res contain the modifications made earlier in the app.all(),
  //due to the next() call in the app.all()
  res.end(`Will send all the leaders to you!`);
})
.post((req, res, next) =>
{
  res.end(`Will add the leader: ${req.body.name} with details: ${req.body.description}`);
})
.put((req, res, next) =>
{
  //operation not supported, put only makes sense to specific leaderes, not on the
  // /leaders endpoint
  res.statusCode = 403;
  res.end(`PUT operation not supported on /leaders`);
})
.delete((req, res, next) =>
{
  res.end(`Deleting all the leaders!`);
});

leaderRouter.route(`/:leaderId`)
.all((req, res, next) =>
{
  res.statusCode = 200;
  res.setHeader(`Content-Type`, `text/plain`);

  //next will pass on the req and res to the next HTTP requests involving
  //the resource /leaders, like the ones defined below
  next();
})
.get((req, res, next) =>
{
  res.end(`Will send details of the leader: ${req.params.leaderId} to you!`);
})
.post((req, res, next) =>
{
  //operation not supported
  res.statusCode = 403;
  res.end(`POST operation not supported on /leaders/${req.params.leaderId}`);
})
.put((req, res, next) =>
{
  res.write(`Updating the leader: ${req.params.leaderId}\n`);
  res.end(`Will update the leader : ${req.body.name} with details ${req.body.description}`);
})
.delete((req, res, next) =>
{
  res.end(`Deleting leader: ${req.params.leaderId}`);
});

module.exports = leaderRouter;
