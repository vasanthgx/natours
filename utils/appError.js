class AppError extends Error {
  constructor(message, statusCode) {
    //whenever we extend another class we use 'super()' to call the constructor of the parent class
    //here Error is the parent class, which takes the error 'message' as the constructor argument
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    //Next we ensure that the instances of the current class does not appear in the stack trace.
    Error.captureStackTrace(this, this.constructor); // this points to the current object and this.constructor points to the constructor class
    //we do not pollute the stack with these objects
  }
}

module.exports = AppError;
