const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // a validator for the 'name' field.
      unique: true,
      trim: true, //the 'trim' is a schema type for String data type. It ensures
      // the whitesapce both in the beginning and end of a string gets trimmed.
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [
        10,
        'A tour name must have greateer or equal than 10 characters',
      ],
      // validate: [validator.isAlpha, 'Tour name must only contain characters' ]
      //note we can also write the above code as an options object as we did
      //for 'priceDiscount' field.
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : easy, medium or difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be greater or equal than 1.0'],
      max: [5, 'Rating must be lesser than or equal to  5.0'],
      set: (val) => Math.round(val * 10) / 10,
      //Just Math.round(val) will give us integers [4.666] will be 5
      //but with (val*10 ) / 10 will be 4.666 * 10 = 47, 4.7
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    //price : Number // [ normal way of defining a field]

    // we are now introducing the schema options object for the price field .
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    // priceDiscount: Number, // note here we are not using the options object
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price; //val represents the price discount value;
          // 'this' points to the current document
        },
        //Note: the 'this' keyword will point to the current document only when we create a new document.
        //so when we update, the above validator funciton will not work
        message:
          'Discount price  ({VALUE} )should be always lesser than the price',
        //here the 'VALUE' is same as the 'val' argument in the callback function
        //this is nothing to do with JavaScript. It is a Mongoose feature.
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, // this is just a reference of the main image that is stored in the database
      //the actual image will be in some filesystem
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // this is an array which contains references to the rest of the
    //images in the application
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false, // this means that usually the tours are not secret
    },

    startLocation: {
      //here this object is not the regular schema type objects  that we have been defining
      //for the other fields in the tourSchema
      //This object is an ---embedded object--- , with a GeoJSON format
      //Each of the sub-fields get their own schema type { } objects
      type: {
        type: String,
        default: 'Point', // in MongoDB we can define multiple geometries like polygons , lines etc
        //but the default is Point.
        enum: ['Point'], //enum is a field, where we can specify all the possible values that the type-field
        //can take. Here we mention just 'Point', to ensure that the value this field takes is always 'Point'
      },
      coordinates: [Number], //this field takes an array of Numbers-
      //Note : The longitude should always come first followed by latitude as per GEO JSON format.
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //for Embedding tour guides
    // guides: Array, //this field 'guides' will be of the type Array
    //this was used for embedding

    //for referencing tour guides
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  // to display virtual properties in Json and Object outputs
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 }); //setting the index for price field. 1, indicates ascending and -1 descending order.
tourSchema.index({ price: 1, ratingsAverage: -1 }); //compound index .
tourSchema.index({ slug: 1 }); //creating an index for the slug field
tourSchema.index({ startLocation: '2dsphere' }); // indicates a 2D sphere index - since we are dealing with geo spatial data.

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; //note 'this' keyword refers to the tourSchema.
  //also note an arrow function cannot be used as a callback fucntion for the
  //get() function, since arrow function do not have access to 'this' keyword.
});

//implementation of virtual populate - of reviews
tourSchema.virtual('reviews', {
  ref: 'Review', // referencing the Review Model
  //next we have to specify the name of the two fields( foreign and local) to connect the two

  foreignField: 'tour', // this is the field in Review Model, where we reference a tour
  localField: '_id', // this is the field in this current Tour Model, where we identify a tour with a '_id'
});

//DOCUMENT MIDDLEWARE: runs before save() and create() commands.

tourSchema.pre('save', function (next) {
  //note: the 'save' argument is also sometimes known as hook(middleware)
  //the 'save' argument makes this a document middleware
  // console.log(this);
  //creating a slug for the 'name' property with lower case.
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Middleware for embedding tour-guides within a Tour document
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   //findById() returns a promise- we need to await and mark this function as async
//   //but finally this anonymous fucntion  will return a promise which will be stored in 'guides'
//   //so let us call this variable as 'guidesPromises'.
//   //to resolve all the promises in the 'guidesPromises [ ]' array we will use--- "await Promise.all(<promise object>)'---

//   this.guides = await Promise.all(guidesPromises); // we are overwriting the guides field in the current document
//   //with the resolved promises - which are the user documents.
//   //Now since we are using the 'await' keyword here, this middleware will be an async function

//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });
// tourSchema.post('save', function (doc, next) {
//   //post middleware has access to the 'doc' which was just saved
//   console.log(doc);
//   next();
// });

/// QUERY MIDDLEWARE: runs before and after a Query is executed
tourSchema.pre(/^find/, function (next) {
  //here the 'this' keyword points to the Query 'find'
  //so 'this'[since it points to a query object] will  have access to all the query methods and we can chain them
  //the hook 'find' makes this a Query middleware
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  //this query middleware will populate the guides field for all queries
  //starting with 'find' for the tourSchema.
  this.populate({
    path: 'guides',
    select: '-__V,-passwordChangedAt',
  });
  next();
});

// post query middleware
// tourSchema.post(/^find/, function (docs, next) {
//   // console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   // console.log(docs);
//   next();
// });

/// AGGREGATION MIDDLEWARE ////we comment out this middleware, since it places the match stage as the first stage in the pipeline-
//// wheras for geoSpatial aggregation pipeline, it is mandatory that the 'geoNear' stage should be the first stage.

// tourSchema.pre('aggregate', function (next) {
//   //as we know the 'this' keyword points to the aggregate object
//   // console.log(this);
//   //since the pipeline is an array of stage objects, we add a match stage at the beginning of
//   //the pipeline using the unshift() method
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

//creating a model based on the above schema
const Tour = mongoose.model('Tour', tourSchema);

//since we have only a single module 'Tour' to export ,
// we will use the module.exports approach

module.exports = Tour;
