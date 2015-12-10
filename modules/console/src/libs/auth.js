import request from 'superagent';

export function loginWithFacebook(token) {
  return request
    .post('/api/login/facebook')
    .send({ token })
    .exec()
    .catch(err => {
      console.log(err);
    });
}

export function loginAnonymously(token) {
  return request
    .post('/api/login/anonymous')
    .exec()
    .catch(err => {
      console.log(err);
    });
}
