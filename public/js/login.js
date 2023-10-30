/* eslint-disable */
//we are disabling eslint for this file, since we have configured only NodeJS

import axios from 'axios';
import { showAlert } from './alerts';
//1)we will create a event listener for the login click in the login form by the user.
//2)first we will select the class 'form' that is associated with the form element and then attach an eventListener('submit')-listening for the 'submit' event.
//3) we will now create a login() function using axios library
//in the next lecture we will download it from npm. Now we use it via CDN

//with npm we were using require() methods , since most of the modules were common JS modules
//with ES 6 modules we use export / import

export const login = async (email, password) => {
  console.log(email, password);
  //   console.log(email, password);
  try {
    //testing the function
    //   alert(email, password);
    //   console.log(email, password);
    //we link the axios cdn in the base.pug file
    const res = await axios({
      method: 'POST',
      // url: 'http://127.0.0.1:3000/api/v1/users/login',//development url
      //   url: 'http://localhost:3000/api/v1/users/login',
      url: '/api/v1/users/login', //relative url
      //since our API and website are hosted on the same server this url will work in production
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'You have successfully logged in');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500); //after 1500 milliseconds
    }
    // console.log(res);
  } catch (err) {
    // console.log(err.response.data);
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      // url: 'http://127.0.0.1:3000/api/v1/users/logout',//dev url
      url: '/api/v1/users/logout', //prod url
      //relative url - since both the website and API are hosted on the same server.
    });
    //making sure that the page  is reloaded so that invalid cookie is sent back to the server
    if (res.data.status === 'success') location.reload(true);
    ///setting the reload(true) will ensure reload from the server and not from the browser cache.
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};

//////////////////shifting the following lines of code to the index.js file///////////////////////////////////

// document.querySelector('.form').addEventListener('submit', (e) => {
//   e.preventDefault(); // to prevent the page from reloading, so that we can capture the values in the form
//   //Next we will acccess the email and password --Values --submitted by the user by selecting the #ids associated with the input elements of email and password
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   //step 3. Next we create a login() function
//   login(email, password);
//   //finally we have to include this login file(javascript file) in the base.pug template with the 'src'attribute
//   //script(src='/js/login.js')
// });
