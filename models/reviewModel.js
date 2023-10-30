const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    CreatedAt: {
      type: Date,
      default: Date.now,
    },
    //Referencing a Tour
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    //Referencing an User
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  }, // to display virtual properties in Json and Object outputs
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
  //tourId is the id  of the tour for which the review was created
  //Remember every review document carries apart from its own id, the tourId and the userId
  // console.log(tourId);
  const stats = await this.aggregate([
    //Note aggregate() method is always called on the Model. Hence we create a static method
    //so that it can be directly be called on the Review Model.
    //this points to the current Model -Review
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        //in the group stage we group by a particular field that we have selected in the 'match' stage and store it in a variable '_id'
        //next we do the calculations
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      //this will make the stats persist in the database.
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // a condition , when there are no reviews
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, //this is a default value , when there are not reviews at all
    });
  }
};

//to call the above function we need the review model and we are currently dealing with a review document
//the 'this' keyword points to the review document. To connect to the Reveiw Model, we attach the 'constructor' property to the 'this' keyword
//we will implement the above through a post middleware

reviewSchema.post('save', function () {
  //Here post document middleware is used, since we need to calculate
  //the stats only after a new review has been created and saved to the database
  //Note : post middleware does not get access to next()
  this.constructor.calcAverageRating(this.tour); //this.tour means the tourId of the current review document
});

//Next we will use a query middleware to call the calcAverageRating( )- static method to calculate stats
//while updating and deleting a review document
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //both 'findByIdAndUpdate' and 'findByIdAndDelete' -behind the scenes use findByOne

  // const r = await this.findOne(); //here this points to the current query
  //and this.findOne()  queries the current review document

  //findOne will give us access to the review document but not the updated one.
  // console.log(r); //so we find that the review document [which contains the tourId in the 'tour' field] is stored in 'r' variable.
  //in order to access 'r' in the next post query middleware  - we store it by 'this.r'

  this.r = await this.findOne(); // so 'r' gets attached to the 'this' object
  // console.log(this.r);
  next();
});

//so to get access to the updated review document we create a post-query middleware
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRating(this.r.tour);
  //this.r.constructor points to Review Model and
  //this.r.tour point to the tourId of the review document.
});

//creating a model from the above schema
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
