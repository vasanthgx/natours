const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use(authController.isLoggedIn);
//we will now use the isLoggedIn() middleware only for the users who are not protected

///In other routes we used to routter.route('/').get(route handler).post(some route handler) etc
//but  here we are going to use just one http method get(), so we directly use router.get('/', route handler)
/////////////////////////////////////////////////Test Router////////////////////////////////////////////////////////////////
// router.get('/', (req, res) => {
//   //route for the base pug template
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker', //the variables that we pass here are known as locals in the pug file
//     user: 'Jonas',
//   }); //here we use render(<pug file name>, <options>) instead of json(<options object>) for the response object.
// });
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Router for overview

// router.get('/overview', (req, res) => {
//   //route for the overview template
//   res.status(200).render('overview', {
//     //overview represents overview.pug file which extends base.pug file
//     title: 'All Tours',
//   });
// });
// router.get('/overview', viewsController.getOverview);
//finally we want the overview page to be displayed right at the root route
//so we change '/overview' to '/'.

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview,
);

/// Router for tour

// router.get('/tour', (req, res) => {
//   //route for the tour template
//   res.status(200).render('tour', {
//     //tour represents tour.pug file which extends base.pug file
//     title: 'The Forest Hiker Tour',
//   });
// });

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
// router.get('/tour/:slug', authController.protect, viewsController.getTour); //testing authentication using JWT from the cookies object

router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);

module.exports = router;
