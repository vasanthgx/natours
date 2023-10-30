const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFunction');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   ///here we are introducing a filter object to get reviews belonging only to a certain tour(tourId)
//   //Note: if there is no tourId in the endpoint of an url, then the filter{} will be null
//   //and as usual we will get all the reviews from the Review Collection

//   const reviews = await Review.find(filter); // here we await , since any query to the database will return a Promise.

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
//   next();
// });

exports.setTourUserIds = (req, res, next) => {
  // Nested Routes
  if (!req.body.tour) req.body.tour = req.params.tourId; //here the tourID is fetched from the url-parameters
  if (!req.body.user) req.body.user = req.user.id; //here the userID is fetched from the protect() middleware
  next();
};
//After creating the above middleware, we upadte the reviewRouter with the above.

// exports.createReview = catchAsync(async (req, res, next) => {
//   // Nested Routes
//   // if (!req.body.tour) req.body.tour = req.params.tourId; //here the tourID is fetched from the url-parameters
//   // if (!req.body.user) req.body.user = req.user.id; //here the userID is fetched from the protect()

//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: { review: newReview },
//   });
// });

exports.getReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
