const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//creating a router and mounting it

// const router = express.Router();
const router = express.Router({ mergeParams: true }); //by default each router has access to paramameters specific to their route.
//with mergeParams property set to true, this router - which we have imported as "reviewRouter" in the tourRouter.js file
//will now have access to the --tourId--parameter, when we call this reviewRouter
// on a specific endpoint like in the tourRouter [router.use('/:tourId/reviews', reviewRouter);]

//mounting the router
// router.route('/'); // we will mount this route on a new path -(api/v1/reviews) in the app.js file
// const reviewRouter = require('./routes/reviewRoutes')/// in the app.js file
//app.use('/api/v1/reviews', reviewRouter); // reviewRouter is basically middleware that we mount on the path('/api/v1/reviews')/// in the app.js file
//so now '/' will indicate '/api/v1/reviews'.

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

//setting the route for handlerFunction
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;
