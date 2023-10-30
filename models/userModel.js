const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a user must have a name'],
    // trim: true,
    // maxlength: [60, 'length of the name must be less than 60 characters'],
    // minlength: [
    //   2,
    //   'length of the name must be greater than equal to 2 characters',
    // ],
  },
  email: {
    type: String,
    required: [true, 'a user must have a email id'],
    unique: true,
    lowercase: true, // this is not a validator. it just coverts all the characters of a email id to lowercase.
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },

  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a password'],
    //defining a custom validator with a callback function
    //which returns true or false.
    validate: {
      validator: function (el) {
        //el points to the confirmPassword input
        return el === this.password;
        //this points to the current document which is being processed.
      },
      //Note : the above validator function will work only on SAVE or CREATE !!!
      //example : User.create() or User.save()
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
////Data encryption -------------------------wecomment this out while importing and the users data from users.json file-----------------------------------------------------------------------
userSchema.pre('save', async function (next) {
  //THIS FUNCTION WILL RUN ONLY IF THE PASSWORD IS MODIFIED.
  if (!this.isModified('password')) return next();

  //HASHING THE PASSWORD WITH THE COST OF 12
  this.password = await bcrypt.hash(this.password, 12); // 12 is the cost parameter for
  //the encryption acitivity and is CPU intensive

  //DELETING THE passwordConfirm field
  this.passwordConfirm = undefined; // this assignment to undefined will
  //result in the previously held value not being persisted in the database.
  //since we need the value only for validation with the 'password' value.
  next();
});

//this middleware is for updating the property 'passwordChangedAt'- For the resetPassword route - where resetting the password is done
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next(); //this.isNew indicates if a new document is created
  //so the above line of code says - if the current document is a not a new one, and if the password of the current document is not modified
  //than just exit and move on to the next middleware .

  //else update the property 'passwordChangedAt'
  this.passwordChangedAt = Date.now() - 1000; // we subtract 1 sec from the timestamp, to ensure
  //that the password was changed before the JWT was issued
  //since when we reset the password, we then generate a new JWT token in the resetPassword() middleware
  //it so happens sometimes that this token is generated before the "changedpasswordAt"  timestamp is created.
  next();
});
////---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
userSchema.pre(/^find/, function (next) {
  //Query middleware to support any query starting with 'find'

  this.find({ active: { $ne: false } }); //here 'this' points to the current Query object.
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    // console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // This line of code returns true
    // if the token issued timestamp is lessthan the password changed timestamp.
    //which means the user has changed the password(after the JWT was issued) after the login
    //which means we have to prevent access to the protected route.(Step 4. of the protect() function)
  }
  //false means NOT changed
  return false;
};

//to generate a random token[which will behave like a temporary password] - which is going to be a string- we are going to
//use the built-in module 'crypto'
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  //next we encrypt the above token and store in a field'passwordResetToken' that we create
  //in our userSchema.
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);
  //next we set an expiry of 10 minutes ( in milliseconds = 10 * 60 *1000) for the reset token
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

//as part of convention,  Model variables are always Capitalized.
const User = mongoose.model('User', userSchema);

module.exports = User;
