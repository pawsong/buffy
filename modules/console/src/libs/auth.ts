import * as axios from 'axios';

export function loginWithFacebook(token) {
  return axios.post(`${CONFIG_AUTH_SERVER_URL}/login/facebook`, { token }, {
    withCredentials: true,
  }).then(res => res.data);
}

export function loginAnonymously() {
  return axios.post(`${CONFIG_AUTH_SERVER_URL}/api/login/anonymous`, {}, {
    withCredentials: true,
  }).then(res => res.data);
}
