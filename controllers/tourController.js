// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFunction');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//when we have a mix of single and multiple set of images to be uploaded we use the fields method
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

//the other types of uplaoading
//upload.single('photo')
//upload.array('images', 3)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files); //Note:if it is single file, then it is req.file or else req.files

  if (!req.files.imageCover || !req.files.images) return next();
  //1) Image cover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg}`;
  //the above line is added, since when it moves into the next middleware in the stack
  //which is updateTour - where through the updateOne factory handler function
  //we update the req.body. to the database.

  //we get access to params, since the route will have tourId in its url-parameters
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //standard 3:2 ratio
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2) Images
  req.body.images = [];
  //Note: we are using async / await within the foreach() loop and it will not affect
  //the running of all overall code.
  //so to avoid this problem instead of foreach() we use the map() which will return an array of promises
  //and which can be resolved by Promise.all
  // req.files.images.foreach(async (file, i) => {
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg}`;
      await sharp(file.buffer)
        .resize(2000, 1333) //standard 3:2 ratio
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
  console.log(req.body);
  next();
});

////Next to test these above 2 middlewares , we will add them to a update route in the tourRoute.js

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// const tours = JSON.parse(
//   //here __dirname points to controllers folder[since tourController.js file  is in routes folder].
//   //So we have to go to higher order  by ../

//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

// exports.checkId = (req, res, next, val) => {
//   console.log(`Tour id is : ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

// to  export we cannot use module.exports = 'router' like before
//since we have more than one function to export
//so we will use the exports object on each function.

// class APIFeatures {
//   constructor(query, queryString) {
//     this.query = query;
//     this.queryString = queryString;
//   }

//   filter() {
//     const queryObject = { ...this.queryString };
//     const excludedFields = ['page', 'sort', 'limit', 'fields'];

//     excludedFields.forEach((el) => delete queryObject[el]);

//     let queryStr = JSON.stringify(queryObject);
//     queryStr = queryStr.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`);
//     this.query = this.query.find(JSON.parse(queryStr));
//     // let query = Tour.find(JSON.parse(queryStr));
//     return this; //this line returns the entire object
//   }

//   sort() {
//     if (this.queryString.sort) {
//       const sortBy = this.queryString.sort.split(',').join(' ');
//       // console.log(sortBy);
//       this.query = this.query.sort(sortBy);
//     } else {
//       // setting a default sort , if the user has not requested for sort

//       this.query = this.query.sort('-createdAt _id');
//     }
//     return this; //this line returns the entire object
//   }

//   limitingFields() {
//     if (this.queryString.fields) {
//       const fields = this.queryString.fields.split(',').join(' ');
//       this.query = this.query.select(fields);
//     } else {
//       this.query = this.query.select('-__v');
//     }
//     return this;
//   }

//   paginate() {
//     const page = this.queryString.page * 1 || 1;
//     const limit = this.queryString.limit * 1 || 100;
//     const skip = (page - 1) * limit;

//     this.query = this.query.skip(skip).limit(limit);
//     return this;
//   }
// }

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // console.log(req.requestTime);

//   // try {
//   //   console.log(req.query);

//   //BUILD QUERY
//   // // 1 A) Filtering
//   // const queryObject = { ...req.query };
//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   // //we will map through the excludedFields array using the forEach() method
//   // //since we do not want to create a separate array.
//   // excludedFields.forEach((el) => delete queryObject[el]);
//   // // console.log(req.query, queryObject);

//   // // const tours = await Tour.find(queryObject);
//   // //avoiding the await key word to preserve it as an query object
//   // //so that it can be chained with the methods like sort(), limit() etc

//   // // 1 B) Advanced Filtering
//   // let queryStr = JSON.stringify(queryObject);
//   // queryStr = queryStr.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`); //b stands for exact match and g stands for multiple occurences
//   // //note replace() method has a callback function which has acccess to the elements(match) in the first argument.
//   // // console.log(JSON.parse(queryStr)); // logging back the JSON object

//   // //{difficulty: 'easy', duration:{$gte: 5}}
//   // //{duration: {gte:'5'}, difficulty: 'easy' // output from the console without the '$' mongodb operator

//   // // const query = Tour.find(queryObject); //saving it as a query object
//   // let query = Tour.find(JSON.parse(queryStr)); //saving it as a query object

//   // 2 A) Sorting with a single criteria
//   // if (req.query.sort) {
//   //   query = query.sort(req.query.sort);
//   // }

//   // 2 B) sorting with a second criteria
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   // console.log(sortBy);
//   //   query = query.sort(sortBy);
//   // } else {
//   //   // setting a default sort , if the user has not requested for sort

//   //   query = query.sort('-createdAt _id');
//   // }

//   // 3) Field Limiting
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   // } else {
//   //   //avoiding the field '__v'  with a '-' sign as a default
//   //   //Note:'__v' is a field required for the mongodb but we need
//   //   //not send it to the client.
//   //   query = query.select('-__v');
//   // }

//   // 4) Pagination
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;

//   // query = query.skip(skip).limit(limit);

//   // //user querying for a page that does not exist
//   // if (req.query.page) {
//   //   //calculating the number of documents by the countDocuemnts() method
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error('This page does not exist');
//   // }

//   //EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitingFields()
//     .paginate();

//   const tours = await features.query;

//   // const tours = await query; //finally applying the await keyword when all the querying is done.

//   // Querying using through mongoose methods - where() , equals()
//   // const query =  Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');

//   //SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     // request: req.requestTime,
//     results: tours.length, // since tours is an  array of objects.
//     data: {
//       tours,
//     },
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.getTour = catchAsync(async (req, res, next) => {
//   // console.log(req.params);
//   // const id = req.params.id * 1; // to convert the string output to a number
//   // const tour = tours.find((el) => el.id === id);
//   // try {

//   // const tour = await Tour.findById(req.params.id);

//   // const tour = await Tour.findById(req.params.id).populate('guides');

//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: 'guides',
//   //   select: '-__V,-passwordChangedAt',
//   // });
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   //the above code can also be written as
//   //Tour.findOne({_id:req.params.id})

//   res.status(200).json({
//     status: 'success',
//     // results: tours.length, // since tours is an  array of objects.
//     data: {
//       tour,
//     },
//   });
// });
// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err,
//   });
// }

// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     //returning an anonymous function

//     //note 'fn' is an async function
//     //transoporting the error to the globalErrorHandler with next(err)
//     // fn(req, res, next).catch((err) => next(err));//note this line
//     //can be further modified to just catch(next)
//     //Note catch() method is available to all rejected promises.
//     fn(req, res, next).catch(next);
//   };
// };

// exports.createTour = async (req, res) => {
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     message: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
//   // try {
//   //   //const newTour = new Tour({}) ---here we create an object from the Tour model
//   //   // newTour.save() --- here we call the save() on the object - which actually refers to the document

//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   // if (req.params.id * 1 > tours.length) {
//   //   return res.status(400).json({
//   //     status: 'fail',
//   //     message: 'Invalid ID',
//   //   });
//   // }
//   // try {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       // tour : tour // from ES6 onwards , when the value name is equal to the property name we can just
//       //mention the name
//       tour,
//     },
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   //  if (req.params.id * 1 > tours.length) {
//   //    return res.status(400).json({
//   //      status: 'fail',
//   //      message: 'Invalid ID',
//   //    });
//   //  }
//   // try {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     // 204 indicates no data[ since we deleted it]
//     status: 'success',
//     data: null,
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    //making use of two stages in this pipeline 'match' and 'group' and 'sort'
    //we pass the stages in an array.
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      // making use of the MongoDB operator $avg and by specifying id = null,
      //we are aggregating all the documents for calculating the average
      $group: {
        // _id: '$difficulty',
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, // here we just passing 1 for each document.
        //So the '$sum' will just keeping adding 1 as each document passes through the pipeline
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // for ascending we use 1
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // try {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        //match stage is always used to select/query
        startDates: {
          //selecting the period 1stJan2021 to 31stDec2021
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fali',
  //     message: err,
  //   });
  // }
});

//route handler for the route ('/tour-within/:distance/center/:latlng/unit/:unit')
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; //we are destructuring the params object
  //Note:latlng is the variable which stores the coordinates of the our current location from where we are
  //we want to know the tour locations within a radius of 400 miles
  const [lat, lng] = latlng.split(','); //split() method returns an array, which we are destructuring

  //mongoDb requires the distance to be in terms of radians [ which is distance / radius of the earth]
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // 3963.2 is the radius of the earth in miles
  //and 6378.1 is  the radious of the earth in km.

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }
  // console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }, //geoWithin is the geoSpatial operator in MongoDB
    //also remember in MongoDB we mention the longitude coordination first and then the latitude coordinate.
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params; //we are destructuring the params object
  const [lat, lng] = latlng.split(','); //split() method returns an array, which we are destructuring
  //Note:'latlng' is the variable which stores the coordinates of the our current location from where
  //we want to calculate the distances to the tour start locations

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }
  const distances = await Tour.aggregate([
    //for geospatial aggregation there is only one single stage - geoNear and
    //remember that it should always be the first in the pipeline.
    //Also atleast one of the fields should have a geoSpatial index[we already have defined geoSpatial Index, for 'startLocation' field]
    //if we have multiple geoSpatial indexes, then we have to mention the keys parameter in order to define the field.
    {
      $geoNear: {
        //we first define our current location using  the 'near' property and next with the 'distanceField' property we store
        //all the calculated distances.
        near: {
          type: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1], //converting string to a number
          },

          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',

    data: {
      data: distances,
    },
  });
});
