const OFFSET_X = -50;
const OFFSET_Y = -50;

const WIDTH = 100;
const HEIGHT = 100;

import Terrain from './models/Terrain';

import _ from 'lodash';

export let terrains = {};

export function setTerrain(terrain) {
  const { x, y } = terrain.loc;
  terrains[`${x}_${y}`] = terrain;
}

export const initMap = async () => {
  const result = await Terrain.find({});

  result.forEach(terrain => {
    const { x, y } = terrain.loc;
    setTerrain(terrain);
  });
}
