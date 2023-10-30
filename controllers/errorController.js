const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // const value = err.keyValue.name.match(/(["'])(\\?.)*?\1/);
  // console.log('without regex :', err.keyValue.name);
  // console.log('with regex :', value);

  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  //we have an 'errors' object within the 'error' object. [err.errors]
  //to get all the error messages within the 'errors' object , we have to loop over it
  //in JavaScript we loop over an Object by Obect.values(<object>)
  const errors = Object.values(err.errors).map((obj) => obj.message);
  const message = `Invalid input data ${errors.join('.  ')}`;
  //converting the errors[ ] array to a string by the join('.  ') method

  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = (err) =>
  new AppError('Your token has expired! Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //B)  RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    //here error is a pug template.
    title: 'Something went wrong',
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  //A) For APIs
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      //if the error is operational, trusted errors[in Production environment]
      //the respnonse would be error specific.
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //if the error is due to a third party package or a programming error
    //the response would be generic[we don't want  to leak the error details to the client]

    //1) log error
    console.error('ERROR 💥', err);

    //2) send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  //B) FOR RENDERED WEBSITE
  if (err.isOperational) {
    //if the error is operational, trusted errors[in Production environment]
    //the respnonse would be error specific.
    return res.status(err.statusCode).render('error', {
      //here error is a pug template.
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  //if the error is due to a third party package or a programming error
  //the response would be generic[we don't want  to leak the error details to the client]

  //1) log error
  console.error('ERROR 💥', err);

  //2) send generic message
  return res.status(err.statusCode).render('error', {
    //here error is a pug template.
    title: 'Something went wrong',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack); //this will output the stacktrace

  //setting up default values if it is not defined
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // let error = {
    //   name: err.name,
    //   ...err,
    // };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);

    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    sendErrorProd(error, req, res);
  }
};
