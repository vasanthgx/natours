const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));

///GLOBAL MIDDLEWARES
//1) Implement CORS -for simple requests[GET and POST]
app.use(cors()); //this returns a middleware function
//which adds certain headers to our response
//header 1)
//Access-Control-Allow-Origin * /////this allows for all requests no matter where they are coming from.
//this is ideal for everyone to consume our api.
//////////////////////////
//but if we  have our API and web application on different domains
//like example.com/api  and front end as example1.com
// app.use({
//   origin: 'https://www.example1.com', //this will allow this site access to the API
// });

//2) Implement CORS -for non-simple requests[PATCH,  DELETE, PUT and cookies and the use of non-standard headers]

app.options('*', cors()); //'*' means it is for all routes
//app.options('/api/v1/tours/:id', cors())// this enables only one particular tour that
//can have a non - simple request.

//Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP Headers
// app.use(helmet());
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", 'data:', 'blob:'],

//       baseUri: ["'self'"],

//       fontSrc: ["'self'", 'https:', 'data:'],

//       scriptSrc: ["'self'", 'https://*.cloudflare.com'],

//       scriptSrc: ["'self'", 'https://*.stripe.com'],

//       scriptSrc: ["'self'", 'http:', 'https://*.mapbox.com', 'data:'],

//       frameSrc: ["'self'", 'https://*.stripe.com'],

//       objectSrc: ["'none'"],

//       styleSrc: ["'self'", 'https:', 'unsafe-inline'],

//       workerSrc: ["'self'", 'data:', 'blob:'],

//       childSrc: ["'self'", 'blob:'],

//       imgSrc: ["'self'", 'data:', 'blob:'],

//       connectSrc: ["'self'", 'blob:', 'https://*.mapbox.com'],

//       upgradeInsecureRequests: [],
//     },
//   }),
// );
//////////////////////////////////////////////////////////////////////

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        upgradeInsecureRequests: [],
      },
    },
  }),
);
//Development Logging
// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//2) Limit requests form same API
//SETTING THE RATE LIMIT OF 100 REQUESTS IN 1 HOUR
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
//Note:rateLimit() is a function which outputs a middleware function
//so we use limiter as a middleware function
// app.use(limiter); // this will give 'limiter' global access
//but we want to limit it to specific APIs
app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);

//Body Parser - reading data from body into req.body
// app.use(express.json());
app.use(express.json({ limit: '10kb' })); // Limiting data to a max of 10 kb
//the above line of code parses data from the body

//the lower line of code parses data from  the cookie
app.use(cookieParser());

//to parse the data that we send through the form with name attributes
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Data Sanitizaton against No SQL query injection
app.use(mongoSanitize()); //mongoSanitize() returns a middleware function
//this function will look at req.body, req.params. req.query etc and filter out the '$' signs and dots
//since the mongodb operators function with these symbols

//Data Sanitizaton against XSS - Cross-site scripting attacks
app.use(xss());

//Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'difficulty',
      'maxGroupSize',
    ],
  }),
);

//Serving Static Files
// app.use(express.static(`public`));
// app.use(express.static(`${__dirname}/public`));
// app.use(express.static(path.join(__dirname, 'public')));

//creating our own middleware
// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👍');
//   next();
// });

app.use(compression()); //this will compress all our TEXT responses to the client

//Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

/// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter); // reviewRouter is basically middleware that we mount on the path('/api/v1/reviews')
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // }),

  ////using the Error Constructor() to define an error 'err' object
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  /// Note : whenever we pass an argument within the next(), Express will assume it as an error
  ///and it will skip all the other middlewares in the middleware stack and send the error that
  ///we passed in to the global middleware function
  // next(err);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

////implementing an error handling global middleware
//// exporting the function to the Controller stage - errorController.js file
// app.use((err, req, res, next) => {
//   console.log(err.stack); //this will output the stacktrace

//   //setting up default values if it is not defined
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//   });
// });

app.use(globalErrorHandler);

module.exports = app;
