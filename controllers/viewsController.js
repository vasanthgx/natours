const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFunction');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up immediatley, please come back later. ";
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. get tour data from collections
  const tours = await Tour.find();
  // 2. build template[ this process will be of course outside the view Controller - at overview.pug]
  //2.1 we now convert the content inside the static file overview.html to pug within the  block content of overview.pug
  //2.2 we now have to fill the above skeleton template having static data with variables, so that we have a dynamic template
  ///2.2.1 in order to generate all the 9 cards, we have to loop through the variable tours[ which is an array containing the 9 tour objects]
  ///this is easy in PUG which comes with built in loops [each tour in tours]

  // 3. render the above template using tour data from step 1.

  //route for the overview template
  res.status(200).render('overview', {
    //overview represents overview.pug file which extends base.pug file
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  //route for the tour template
  res.status(200).render('tour', {
    //tour represents tour.pug file which extends base.pug file
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    //here 'login' refers to the login.pug  template
    title: 'Log into your account',
  });
};

// exports.getLoginForm = (req, res) => {
//   res
//     .status(200)
//     .set('Content-Security-Policy', "connect-src 'self' http://127.0.0.1:3000/")
//     .render('login', {
//       title: 'Log into your account',
//     });
// };

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

// exports.getMytours = catchAsync(async (req, res, next) => {
//   /////we could also do a virtual populate on the tours[as we had done with tours and reviews]
//   //1) Find all Bookings
//   const bookings = await Booking.find({ user: req.user.id });
//   //this gives us all the booking documents pertaining to a particular user

//   //2) Find tours with the returned tourids from the bookings in step 1.
//   const tourIds = bookings.map((el) => el.tour); //here tour represents the tour id for which the booking was done.
//   //tourIds[ ]  is an array with all  the tourIds as elements
//   const tours = await Tour.find({ _id: { $in: tourIds } });
//   //this translates to find all _id in the Tour model, which are in the array of TourIds

//   res.status(200).render('overview', {
//     title: 'My-tours',
//     tours,
//   });
// });

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log('Updating User....', req.body);

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      //we get access to the user variable, since we are using the protect() middleware in this route.

      //Note that we extract the name and email fields from the req.body{} object
      //due to the name atttributes that we included in the input element of our form
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true, // this ensures hat we get a new updated document.
      runValidators: true,
    },
  );
  //Next after sending and  updating the user document ,  the response we
  //we would like to have is that the Account page to be rendered again with the updated user details
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});
