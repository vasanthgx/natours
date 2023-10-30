const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      // 204 indicates no data[ since we deleted it]
      status: 'success',
      data: null,
    });
  });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     // 204 indicates no data[ since we deleted it]
//     status: 'success',
//     data: null,
//   });
// });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        // tour : tour // from ES6 onwards , when the value name is equal to the property name we can just
        //mention the name
        data: doc,
      },
    });
  });

// exports.updateTour = catchAsync(async (req, res, next) => {

//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       // tour : tour // from ES6 onwards , when the value name is equal to the property name we can just
//       //mention the name
//       tour,
//     },
//   });
// });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      message: 'success',
      data: {
        data: doc,
      },
    });
  });

//   (exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       message: 'success',
//       data: {
//         tour: newTour,
//       },
//     });

//   }));

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id); //note we are not "awaiting"  the query - we are just assigning it to a variable.
    if (popOptions) query = Model.findById(req.params.id).populate(popOptions);
    const doc = await query;
    // const doc = await Model.findById(req.params.id).populate(popOptions);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',

      data: {
        doc,
      },
    });
  });

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',

//     data: {
//       tour,
//     },
//   });
// });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //The following 2 lines of code is to allow GET  reviews of a particular  tour(hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitingFields()
      .paginate();

    const docs = await features.query;
    // const docs = await features.query.explain();

    res.status(200).json({
      status: 'success',

      results: docs.length,
      data: {
        data: docs,
      },
    });
  });

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   //EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitingFields()
//     .paginate();

//   const tours = await features.query;

//   //SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     // request: req.requestTime,
//     results: tours.length, // since tours is an  array of objects.
//     data: {
//       tours,
//     },
//   });
// });
