import * as express from 'express';

const auth = express();

/*
app.use((req, res, next) => {
  if (!req.user) {  }
  if (req.user) { return res.redirect('/'); }
  next();
});
*/

auth.get('/login', (req, res) => {
  res.send({ message: 'login' });
});

export default auth;