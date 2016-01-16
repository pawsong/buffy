import * as axios from 'axios';

export function loginWithFacebook(token) {
  return axios.post('/api/login/facebook', { token }).then(res => res.data);
}

export function loginAnonymously() {
  return axios.post('/api/login/anonymous', {}).then(res => res.data);
}
