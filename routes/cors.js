const express = require("express");
const cors = require("cors");
const app = express();

//all the origins that the server is willing to accept for Cross-origin resource sharing
const whitelist = ["https://localhost:3000", "https://localhost:3443"];

//checks to see if the incoming request's origin is allowed
const corsOptionsDelegate = function(req, callback)
{
  var corsOptions;

  //If the request contains a header with "Origin", we will check our whitelist
  //to see if the origin is allowed for cors
  if (whitelist.indexOf(req.header("Origin")) !== -1)
  {
    //origin:true lets the cors module that the origin in the request is in
    //whitelisted, so the cors module will reply back including that origin into
    //the response headers to the client as being allowed
    corsOptions = { origin: true };
  }

  //not a whitelisted origin
  else
  {
    corsOptions = { origin: false };
  }

  callback(null, corsOptions);
};

//cors() would basically reply back with allowOrigin with a wildcard (*) in it,
//so it would accept every cors request. This can be acceptable for GET operations
//since they don't cause side effects on the server.
exports.cors = cors();

//if we need to apply certain restrictions, we will use this exports instead,
//where we have defined our own options delegate
exports.corsWithOptions = cors(corsOptionsDelegate);
