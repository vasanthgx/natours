/* eslint-disable */
// console.log('Hello from Parcel');

//This index.js file is basically to get data from the user interface and delegate action
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';

import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// const locations = JSON.parse(document.getElementById('map').dataset.locations); //shifted from mapbox.js
// displayMap(locations);

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');

const logOutBtn = document.querySelector('.nav__el--logout');

const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//Delegation
if (mapBox) {
  const locations = JSON.parse(document.mapBox.dataset.locations); //shifted from mapbox.js
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

// if (userDataForm)
//   userDataForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const name = document.getElementById('name').value;
//     const email = document.getElementById('email').value;
//     updateSettings({ name, email }, 'data');
//   });
//////Refactoring the above to submit programmatically multipart data
if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    //files[] is an array, since we are sending only one file, we have files[0]
    console.log(form);

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    document.querySelector('.btn--save-password').textContent = 'SAVE PASSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', () => {
    console.log('hi');
  });
// (e) => {
//   console.log('s');
//   e.preventDefault();
//   e.target.textContent = 'Processing...';
//   // const tourId = e.target.dataset.tourId;//remember tour-id gets converted to camel case tourId
//   //since the variable name and the dateset property is same we can destructure it
//   // const { tourId } = e.target.dataset;
//   // bookTour(tourId);
// });
// document.querySelector('.form').addEventListener('submit', (e) => {
//   e.preventDefault(); // to prevent the page from reloading, so that we can capture the values in the form
//   //Next we will acccess the email and password --Values --submitted by the user by selecting the #ids associated with the input elements of email and password
// //   const email = document.getElementById('email').value;
// //   const password = document.getElementById('password').value;
//   //step 3. Next we create a login() function
//   login(email, password);
//   //finally we have to include this login file(javascript file) in the base.pug template with the 'src'attribute
//   //script(src='/js/login.js')
// });
////////////////////////////////////////////////////////////////////////////////////
// /* eslint-disable */
// import '@babel/polyfill';
// import { displayMap } from './mapbox';
// import { login, logout } from './login';
// import { updateSettings } from './updateSettings';
// import { bookTour } from './stripe';

// // DOM ELEMENTS
// const mapBox = document.getElementById('map');
// const loginForm = document.querySelector('.form--login');
// const logOutBtn = document.querySelector('.nav__el--logout');
// const userDataForm = document.querySelector('.form-user-data');
// const userPasswordForm = document.querySelector('.form-user-password');
// const bookBtn = document.getElementById('book-tour');

// // DELEGATION
// if (mapBox) {
//   const locations = JSON.parse(mapBox.dataset.locations);
//   displayMap(locations);
// }

// if (loginForm)
//   loginForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     login(email, password);
//   });

// if (logOutBtn) logOutBtn.addEventListener('click', logout);

// if (userDataForm)
//   userDataForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const form = new FormData();
//     form.append('name', document.getElementById('name').value);
//     form.append('email', document.getElementById('email').value);
//     form.append('photo', document.getElementById('photo').files[0]);
//     console.log(form);

//     updateSettings(form, 'data');
//   });

// if (userPasswordForm)
//   userPasswordForm.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     document.querySelector('.btn--save-password').textContent = 'Updating...';

//     const passwordCurrent = document.getElementById('password-current').value;
//     const password = document.getElementById('password').value;
//     const passwordConfirm = document.getElementById('password-confirm').value;
//     await updateSettings(
//       { passwordCurrent, password, passwordConfirm },
//       'password',
//     );

//     document.querySelector('.btn--save-password').textContent = 'Save password';
//     document.getElementById('password-current').value = '';
//     document.getElementById('password').value = '';
//     document.getElementById('password-confirm').value = '';
//   });

// if (bookBtn)
//   bookBtn.addEventListener('click', (e) => {
//     e.target.textContent = 'Processing...';
//     const { tourId } = e.target.dataset;
//     bookTour(tourId);
//   });
