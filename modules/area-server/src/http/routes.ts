import * as express from 'express';
import * as ejwt from 'express-jwt';
import * as conf from '@pasta/config';
import * as Promise from 'bluebird';
import wrap from '@pasta/helper/lib/wrap';
import GameUserModel from '../models/GameUser';
import GameMapModel from '../models/GameMap';
import { GameMapDocument } from '../models/GameMap';
import * as Constants from '../Constants';
import * as request from 'request-promise';

export default (app: express.Express) => {
  app.get('/', (req, res) => {
    res.send({});
  });

  app.get('/friends', ejwt({
    secret: conf.jwtSecret,
    getToken: req => req.cookies.tt,
  }), wrap(async (req, res) => {
    const result = await request.get({
      uri: `${Constants.authServerUrl}/friends`,
      headers: { Authorization: `Bearer ${req.cookies.tt}` },
      json: true,
    });

    const userIndexedById = {};
    const userIds = [];
    result.forEach(user => {
      userIndexedById[user.id] = user;
      userIds.push(user.id);
    });

    const gameUsers = await GameUserModel
      .find({ owner: { $in: userIds }})
      .populate('home')
      .exec();

    res.send(gameUsers.map(gameUser => {
      const json = gameUser.toObject();
      json['name'] = userIndexedById[gameUser.owner].name
      return json;
    }));
  }));
};
