
const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../authenticate.js");
const multer = require("multer");
const cors = require("./cors.js");

//configure multer (the Node module that enables us to handle multiple file uploads)
//define the storage options
const storage = multer.diskStorage({

  //receives the request, the file data processed by multer and a callback
  destination: (req, file, cb) =>
  {
    //second parameter is destination folder where files will be stored
    cb(null, `public/images`);
  },

  filename: (req, file, cb) =>
  {
    //second parameter is the filename. The field .originalname is the original
    //filename that the file was uploaded with. If this is not configured, Multer
    //will give the file a random string name with no extensions.
    cb(null, file.originalname);
  }
});

//enables us to specify which kinds of files we will accept for uploading
const imageFileFilter = function(req, file, cb)
{
  //extension does not match the files we want to accept
  if (file.originalname.match(/\.(jpg|jpeg|png|gif)$/) == null)
  {
    //second parameter specifies that the file did not pass the filter
    return cb(new Error(`You can only upload image files!`), false);
  }

  //second parameter specifies that the file passed the filter
  cb(null, true);
};

//plug in the options we defined for multer and initialize it
const upload = multer({ storage: storage, fileFilter: imageFileFilter});

const uploadRouter = express.Router();

uploadRouter.use(bodyParser.json());

uploadRouter.route(`/`)
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  res.statusCode = 403;
  res.end(`GET operation not supported on /imageUpload`);
})
//add multer as the next middleware to use after the authentications,
//specifying that only a single file can be uploaded at a time, and name it
//imageFile. This key name is the one that will be used on the client as well,
//as part of body contents. This middleware will also handle the errors with
//the upload inside it, so within the .post block itself we can assume
//it all went correctly
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.single("imageFile"),
(req, res) =>
{
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");

  //send back the .file object to the client, which contains among other things
  //the direct URL to the file that was uploaded, in case it needs to be used
  //(for example, to then store the URL in the database as part of a model).
  //req.file contains the fields "fieldname" (the key "fileName" which we
  //specified above in upload.single()), "originalname", "encoding", "mimetype",
  //"destination", "filename", "path" and "size".
  res.json(req.file);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  res.statusCode = 403;
  res.end(`PUT operation not supported on /imageUpload`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
{
  res.statusCode = 403;
  res.end(`DELETE operation not supported on /imageUpload`);
})

module.exports = uploadRouter;
