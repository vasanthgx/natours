// /* eslint-disable */
// import axios from 'axios';
// import { showAlert } from './alerts';
// const stripe = Stripe(
//   'pk_test_51O6BrvSEvPjFJbBZW32IcLk5Pfa5XdIke6TU1MiNZD2Teg6FlUdVDHBmXqWo1SrPBz5uxo3qq9P75Ri89zvRzgkn00KGSunUIP',
// );
// //the above Stripe() object is got from the script tag we included in the tour.pug template
// //Next we will define a function bookTour(tourId). The tourId  will be got from the tour.pug template user interface.
// //this bookTour will be called from index.js

// export const bookTour = async (tourId) => {
//   console.log('hi');
//   try {
//     // const stripe = Stripe(
//     //   'pk_test_51O6BrvSEvPjFJbBZW32IcLk5Pfa5XdIke6TU1MiNZD2Teg6FlUdVDHBmXqWo1SrPBz5uxo3qq9P75Ri89zvRzgkn00KGSunUIP',
//     // );
//     //1) we need to get the session from the server to the client side using the endpoint - '/checkout-session/:tourId'
//     //we will use axios() method to make the API call
//     //normally for the axios() method we mention  the http method, url and the data in an options object
//     //but here now we skip the options object, since we are just making a get request
//     const session = await axios(
//       `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
//     );
//     console.log(session); //now in the index.js we will now connect the book tour now button with this bookTour() function

//     //2_ using the Stripe() object to automatically create the checkout form and charge the credit card
//     await stripe.redirectToCheckout({
//       sessionId: session.data.session.id,
//     });
//   } catch (err) {
//     console.log(err);
//     showAlert('error', err);
//   }
// };
//////////////////////////////////////////////////////////////////////
/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51O6BrvSEvPjFJbBZW32IcLk5Pfa5XdIke6TU1MiNZD2Teg6FlUdVDHBmXqWo1SrPBz5uxo3qq9P75Ri89zvRzgkn00KGSunUIP',
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      // `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,dev url
      `/api/v1/bookings/checkout-session/${tourId}`, //prod url
    );
    // console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    // console.log(err);
    showAlert('error', err);
  }
};
