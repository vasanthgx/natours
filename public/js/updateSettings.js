/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// export const updateData = async (name, email) => {
//   try {
//     const res = await axios({
//       method: 'PATCH',
//       url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
//       //this is the url for updating the current user
//       data: {
//         name,
//         email,
//       },
//     });
//     if (res.data.status === 'success') {
//       showAlert('success', 'Updated Successfully!');
//     }
//   } catch (err) {
//     showAlert('error', err.response.data.message);
//   }
// };
export const updateSettings = async (data, type) => {
  //here data is an object containing all the fields we want to update
  //and type is either 'password' for 'data'
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated Successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
