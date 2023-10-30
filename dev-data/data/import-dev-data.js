const fs = require('fs');
const mongoose = require('mongoose');

const dotenv = require('dotenv');

const Tour = require('../../models/tourModel'); // we need access to the Tour model
const Review = require('../../models/reviewModel'); // we need access to the Review model
const User = require('../../models/userModel'); // we need access to the User model

dotenv.config({ path: './config.env' });

// const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose //the output of this connect() method is a promise. hence we chain it with
  //then() method to resolve the promise.
  .connect(DB, {
    //some options for dealing with deprecation warnings
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

//READ JSON FILE
//   const tours = fs.readFileSync('tours-simple.json', 'utf-8')// this will give us a JSON object
//and to convert it to JavaScript object we need to use JSON.parse()
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

//IMPORT DATA INTO DATABASE
//Note the model.create() method accepts an object and also an array of objects
//here we pass tours[which is an array of tour objects] to the create() method
//which will create documents in the database under the 'tours' collection.
const importData = async () => {
  try {
    await Tour.create(tours);
    await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false }); //we introduce the options object in the create() method
    // for the user - with the validateForSave:false, because while creating a new user,
    //there would a validation error for 'passwordConfirm'
    //Also the user data in the users.json file have encrypted passwords
    //so for this we have to skip password encryption step - which means
    //we will comment out the password encryption middleware in the userModel.js files, while importing the user data.

    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// to delete all data that is already existing in the database

const deleteData = async () => {
  try {
    await Tour.deleteMany(); // this will delete all the documents in the tours collection.
    await Review.deleteMany(); // this will delete all the documents in the reviews collection.
    await User.deleteMany(); // this will delete all the documents in the users collection.
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
//process.argv gives us access to an array, which contains the path to the command that we run in the terminal
// so when we add an option/ flag to the existing command like --import  or --delete
//the flags get populated in the process.argv array.
// which we can then easily extract the flag, and based on it execute the functions - importData() or deleteData().
