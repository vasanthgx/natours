module.exports = (fn) => {
  return (req, res, next) => {
    //returning an anonymous function

    //note 'fn' is an async function
    //transoporting the error to the globalErrorHandler with next(err)
    // fn(req, res, next).catch((err) => next(err));//note this line
    //can be further modified to just catch(next)
    //Note catch() method is available to all rejected promises.
    fn(req, res, next).catch(next);
  };
};
