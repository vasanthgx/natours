const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFunction');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/`, //home url

    //the below method of redirecting a user to the bookings url is not a secure method.
    //we are just doing it temporarily. Once we deploy the site, then Stripe will provide us
    //with web hooks, with which we can get access to the bookings url
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,

    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // tour details page
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  //3) send it to client as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //This is only a temporary solution.
//   const { tour, user, price } = req.query;
//   //Note: this middleware is going to be engaged after a succcessful checkout session happens
//   // and then is redirected to the '/' home page attached with the parameters - [tour,user,price]
//   //next the middleware that we are defining , should follow which middleware?[it should be in the get('/') route,in the beginning]
//   //remember all this is temporary, till we get deploy our site, where we will have a better solution

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });
//   //after creating the booking we want to redirect the user to the '/' home page
//   //for which we use the split('?') method and and access the first element in the array
//   //which would be the url without  the parameters - which is the home page.
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[1].unit_amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event; //since let and const are block scoped , we define 'event' outside the try/catch block
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send('Webhook error : err.message');
  }
  if (event === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

// using the factory handler for the CRUD functions for this Booking resource
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.upDateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
