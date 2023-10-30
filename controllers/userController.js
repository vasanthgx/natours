const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFunction');

//configuring multer
//1) configuration of how we want to store our files.
//it consists of 2 functions destination() and filename()
//destination will define the destination of the uploaded files
//and filename will define the structure of the  name of the file.
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     //cb is a callback function similar to next() in express
//     cb(null, 'public/img/users'); //null indicates no error
//   },
//   filename: (req, file, cb) => {
//     //setting the file format to be unique, so that there no file uploads with the same name.
//     //user-<id...>-<timestamp>-file extension
//     const ext = file.mimetype.split('/')[1]; //extracting the file extension from the file {}object
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

//after uploading and before processing an image, we would like it to store the image in memory and check
//if it is at the right size.
//we comment out the disk storage and use the following storage
const multerStorage = multer.memoryStorage();
// now the file which is uploaded is  available at req.file.buffer

//2) creating a Filter
//the goal of this function is to test whether the uploaded file
//is an image file
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });
// //we set the destination folder, where are uploaded impages will be saved

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //this is a very important step.
  //since the next middleware in the stack 'updateUser' can use the filename.

  // sharp(req.file.buffer)//this creates an object on which we can chain  multiple methods
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
  //this will hand over to the next middleware in the stack
  //[which is 'updateMe' for now in the updateMe route - ]
});

//this is a helper function which will filter out the fields from the req.body object
//so that we are left only with the fields of the req.body object that can be manipulated

const filterObj = (obj, ...allowedFields) => {
  //allowedFields[ ] is an array containing the fields that can be manipulated.
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    //Object.keys(obj) - gives us an array of the keys of the object 'obj'
    //which we can loop over with forEach() method.
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; //Note: getOne() factory function also uses the same 'req.params.id' in its query
  next();
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find(); //finc() fetches all users

//   //SEND RESPONSE
//   res.status(200).json({
//     status: 'success',

//     results: users.length,
//     data: {
//       users,
//     },
//   });
//   // res.status(500).json({
//   //   status: 'error',
//   //   message: 'This route is not yet defined!',
//   // });
// });

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  //1) Create Error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
    //400 means bad request
  }

  //2) Update user document
  // const user = await User.findById(req.user.id);
  // user.name = 'Vasanth Gopal';
  // await user.save();//we get a validation error of "passwordConfrim"  with user.save()
  //to avoid this we will use findByIdAndUpdate() - since we are not validating passwords
  ///// const updatedUser = await User.findByIdAndUpdate(req.user.id, x, {new:true, runValidators:true}) //x is a place holder for the data that is to be updated.
  //  //so we have to be specific, about which fields that are allowed to be updated. In this application , we are allowing only
  //   //name and email id to be updated. So we have to filter out the 'req.body' object and pass only the relevant fields
  //   //that can be manipulated.

  const filteredBody = filterObj(req.body, 'name', 'email');
  //adding photo property to the filteredBody{} object
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  // since the user is logged in , we can access the id by req.user.id
  //Note:this delete will just make the user inactive and not delete the user from the database.

  res.status(204).json({
    //204 means deleted
    status: 'success',
    data: null,
  });
});

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!',
//   });
// };
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use / signup instead',
  });
};

//remember this handler function is only for admins and only for data that is not a password
//since = whenever we use the query - 'findByIdAndUpdate' - all the safe middleware is not run
//so it is important not to attempt to change password while using the updateUser() handler.

// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!',
//   });
// };

//remember this delete can be done only by the admin and  will delete the user from the database
// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!',
//   });
// };

exports.getUser = factory.getOne(User); //Note here the popOptions object is not required.
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
