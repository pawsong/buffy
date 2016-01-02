const OFFSET_X = -50;
const OFFSET_Y = -50;

const WIDTH = 100;
const HEIGHT = 100;

import {
  Terrain,
} from '@pasta/mongodb';

import * as _ from 'lodash';

export let terrains = {};

export function setTerrain(terrain) {
  terrains[`${terrain.loc.x}_${terrain.loc.y}`] = terrain;
}

export const initMap = async () => {
  const result = await Terrain.find({});

  result.forEach(terrain => {
    setTerrain(terrain);
  });
}
