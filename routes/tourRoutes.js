const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

//remember here we are importing multiple route handlers into the tourController object.

//the above can be also be destructured as below

// const {getAllTours,createTour,getTour,updateTour,deleteTour} = require('./../controllers/tourController')

const router = express.Router();
//we mount a router for reviews[ this is as per lecture 159, to avoid the confusion of creating a review router within the tour router]
//so now with this , the tour route and review route are separated and decoupled
//next we have to allow the reviewRouter to get access to the  --tourId-- parameter within the end point '/:tourId/reviews'
router.use('/:tourId/reviews', reviewRouter);

// router.param('id', (req, res, next, val) => {
//    console.log(`Tour id is : ${val}`);
//   next();
// });

//////////////////////////////////////////////////////////////////////////////
router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

//creating a route for finding routes within a certain radius
router
  .route(
    //this url is different from the regular urls we have been defining so far
    //here the parameter 'latlng' indicates the coordinates of the place you are currently living in(center)
    //and 'unit' indicates the distance in miles or kms
    '/tours-within/:distance/center/:latlng/unit/:unit',
  )
  .get(tourController.getToursWithin);
//Also note that the above endpoints in the route could be written in the usual way
//tours-within?distance=233&center=34.131229, -118.136435&unit=mi
//getToursWithin is the route handler which we will define in the tourController.

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// router.param('id', tourController.checkId);
//authController.protect,

// .get(authController.protect, tourController.getAllTours)
//removing the authorization for getAllTours - so that it is accessible to all.
//and adding restrictions for creating Tours
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

///Nested Routes

//POST/tour / <tour ID> / reviews
//GET /tour / <tour ID> / reviews [this will fetch all   reviews pertaining to a particular tour ID]
//GET /tour / <tour ID> / reviews / <review ID>[this will fetch a particular review pertaining to a particular tour ID]

//Nested route for creating[POSTing ] a review

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   );

//exporting the module
module.exports = router;
