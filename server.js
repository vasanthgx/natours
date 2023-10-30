const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

//note the app has to be imported only after the configuration

const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down ...');
  console.log(err);
});

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
    // useUnifiedTopology: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 3000;
// const port = 9000;
const server = app.listen(port, () => {
  console.log(`listening on ${port}...`);
});
// .catch((err) => console.log('ERROR'));
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down ...');
  console.log(err);
  server.close(() => {
    process.exit(1); // it is '0' for success and ' 1 ' for uncaught exception
  });
});

process.on('SIGTERM', () => {
  console.log(':rofl: SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    //this ensures that the server is not closed abruptly
    //but to finish all pending requests and then shut down.
    console.log(':smi::100:Process terminated');
    // here we do not run -process.exit(1 ) - since the SIGTERM signal
    //will itself shut down the application
  });
});
