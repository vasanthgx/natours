const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect); //protecting all routes of booking

// router.get(
//   '/checkout-session/:tourId',
//   authController.protect,
//   bookingController.getCheckoutSession,
// );
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

//restricting to admins and lead-guides the access to all bookings and to create Booking
// router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.upDateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
