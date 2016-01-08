import * as Promise from 'bluebird';
import * as superagent from 'superagent';

superagent.Request.prototype.exec = function () {
  const req = this;
  return new Promise(function(resolve, reject) {
    req.end(function(err, res) {
      if (err) {
        err.response = res;
        return reject(err);
      }
      resolve(res.body);
    });
  });
};
