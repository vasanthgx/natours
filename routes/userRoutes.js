const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

//Moving multer to userController.

// const upload = multer({ dest: 'public/img/users' });
// //we set the destination folder, where are uploaded impages will be saved

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect); //this line of code will protect all routes appearing after it
//since we know middlewares are executed in sequence

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

router.patch('/updateMyPassword', authController.updatePassword);

router.get(
  '/me',

  userController.getMe,
  userController.getUser,
);

router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin')); //this line of code will restrict all routes only to admins after it

//creating routes for Users resource
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
