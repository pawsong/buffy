import Promise from 'bluebird';
import superagent from 'superagent';

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
