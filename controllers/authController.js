const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const sendEmail = require('../utils/email');//we used this before creating the Email class
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
// exports.signUp = async (req, res, next) => {
//   //we will get the user details from req.body property(object) - which returns a promise
//   //that is why signUp is an async function.
//   const newUser = await User.create(req.body);

//   //next we send the response to the client with 201[ status code for user created]
//   res.status(201).json({
//     status: 'success',
//     data: {
//       user: newUser,
//     },
//   });
// };
//next the above function is an async function and  we should wrap it in try / catch block
//for which we have the catchAsync() function.

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ), //converting 90 days to milliseconds
    // secure: true, //this indicates that the secure will be sent over a secure connection -https
    httpOnly: true, //this ensures that the cookie cannot be modified by the browser.
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //res.cookie(name of the cookie, itsvalue, options{})
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined; //this is done so that the password is not attached with the response object.

  //next we send the response to the client with 201[ status code for user created]
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //we will get the user details from req.body property(object) - which returns a promise
  //that is why signUp is an async function.

  const newUser = await User.create(req.body);
  //fixing this line of code with the following block to make it more secure
  // const newUser = await User.create({
  //   //with this block, the user can no longer register as an admin.
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  //   passwordChangedAt: req.body.passwordChangedAt,
  //   role: req.body.role,
  // });

  // const url = 'http://127.0.0.1:3000/me';
  const url = `${req.protocol}://${req.get('host')}/me`;
  //getting the protocol(http of https) and the host programmatically
  //depending upon whether we are in development or production
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  //creating a JWT for signup
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });
  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);

  //next we send the response to the client with 201[ status code for user created]
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  // const email = req.body.email;
  // const password = req.body.password;
  // by destructuring we can write the same thing as below
  // console.log('req: ', req.body);
  const { email, password } = req.body;

  //1) to check email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  //2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); //the '+ ' is used to re select the 'password' object
  //since it was set to false.
  console.log(user);

  //correctPassword which we defined in the userModel.js is an instance method and is
  //available to all the documents of a collectoin.
  //here 'user' is one such document.
  // const correct = await user.correctPassword(password, user.password);
  if (!user || !(await user.correctPassword(password, user.password))) {
    //Note: 'password' is the candidate password
    //and user.password is the original password which is encrypted and persisting in the database.

    return next(new AppError('Incorrect email or password', 401));
  }

  //3) if everything ok, send token to client
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    ///cookie[without any token] to expire within 10 seconds
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting token and check if it is there
  let token; //with ES6 , variables are block scoped : meaning that if the variables are defined within a if{ } block then
  //we cannot access it outside the block.
  //so here we are defining 'token' outside the if block.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // to extract only the token from the string 'Bearer <token>'
    //remember the split() method outputs an array.
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);
  if (!token) {
    return next(
      new AppError(
        'You are not yet logged in! Please log in to get access',
        401,
      ), //status code 401 means unauthorized
    );
  }
  //2. Verification of the token
  /// we want to promisify a function so that we can use the catchAsync() function
  ///for which we use a built-in function promisify() from the 'util' module.
  ///signature of the verify( ) : verify(token: string, secretOrPublicKey: jwt.Secret, options: jwt.VerifyOptions & { complete: true; }): jwt.Jwt
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to  this token no longer exists!', 401),
    );
  }

  //4. Check if user has changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //if it is true -
    //.the password has been changed after the JWT was issued
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );
  }

  //GRANT ACESS TO PROTECTED ROUTE
  req.user = currentUser; // updating the user - which could be useful sometime in the future
  res.locals.user = currentUser; //this will enable all our templates to have access to 'user'variable now.
  //[it is like passing data into the pug templates using the render() function]
  next(); //Remember next() leads us to the next midddleware, which would be the route handler.
});

//This middleware is only for rendered pages - so there will be no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1)  verifying the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      // console.log(decoded);

      //2). Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //3) Check if user has changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        //if it is true -
        //.the password has been changed after the JWT was issued
        return next();
      }

      //The above steps confirm that there is an logged in user.
      //Now we have to make the user accessible to our templates - by using the --locals-- property of the response object
      res.locals.user = currentUser; //this will enable all our templates to have access to 'user'variable now.
      //[it is like passing data into the pug templates using the render() function]
      return next();
    } catch (err) {
      return next();
    }
  }
  next(); //this next() exists if there is no cookie.[which means there is no logged in user.]
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //roles is an [ ] array having user roles ('admin', 'user' etc) as elements
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
        //403 means forbidden
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('There is no user with specified email address', 404),
      //404 means not found.
    );
  }
  //2) Generate the random test token
  ///for this we once again create an instance method (createPasswordResetToken) on the user document
  ///in the userModel.js fils
  const resetToken = user.createPasswordResetToken();
  // await user.save();
  await user.save({ validateBeforeSave: false });
  // await user.save({ validateModifiedOnly: true });

  //3) Send the token to the user's email.
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    // const message = `Forgot you password? Submit a PATCH request with you new password and
    // passwordConfirm to : ${resetURL}.\nIf you didn't forget your password,please ignore this email!`;
    // await sendEmail({
    //   email: user.email,
    //   //email:req.body.email, // even this line is ok
    //   subject: 'Your password reset token (valid for 10 minutes )',
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user  based on  the token
  ///here we encrypt the token(random token) and then compare with the already encrypted token in the database
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    //checking for the user as well as validating expiry date of the token(random token - not JWT)
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2)If token has not expired, and the user exists then set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //after updating the password we will delete the password reset and the expiry properties
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //3) Update changedPasswordAt property for the user
  ///this is done through a middleware pre('save') in the userModel.js file

  //4) log the user in , send JWT
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

//this function is for users, who are already logged in
//to update their password
//we need to ask for the current password, before allowing the user to update
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Getuser from collection
  const user = await User.findById(req.user.id).select('+password');

  //2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    //we are introducing a new property 'passwordCurrent'
    //in userSchema to compare it with the original password
    return next(new AppError('Your current password is wrong', 401)); //401 means unauthorized
  }
  //3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //next we have to save the new updated passwords
  await user.save(); //this time we are not using 'validateBeforeSave:false' since we want the validation to happen
  //Note: we have not used "user.findByIdAndUpdate()" since our validate property will only function on new document creation-create() or save()

  //4) Log user in, send JWT
  //we would normally do it by the following code
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  //but since we are using the above lines of code for logging in and sending the JWT
  //we will export these lines into its own function "createSendToken" and refactor this and the other
  //middleware functions accordingly

  createSendToken(user, 200, res);
});
