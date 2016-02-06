import * as express from 'express';
import * as ejwt from 'express-jwt';
import * as conf from '@pasta/config';
import * as Promise from 'bluebird';
import wrap from '@pasta/helper/lib/wrap';
import GameUserModel from '../models/GameUser';
import GameMapModel from '../models/GameMap';
import { GameMapDocument } from '../models/GameMap';

export default (app: express.Express) => {
  app.get('/', (req, res) => {
    res.send({});
  });

  app.get('/friends', ejwt({
    secret: conf.jwtSecret,
    getToken: req => req.cookies.tt,
  }), wrap(async (req, res) => {
    const users = await GameUserModel
      .find({})
      .populate('home')
      .exec();
    res.send(users);
  }));
};
