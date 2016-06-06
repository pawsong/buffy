import * as ndarray from 'ndarray';
import {
  Position,
  Direction,
} from '@pasta/core/lib/types';
const update = require('react-addons-update');

import {
  EditModeState,
  EditToolType,
  Robot,
  WorldData,
} from '../types';

import {
  Action,
  ADD_ROBOT, AddRobotAction,
  REMOVE_ROBOT, RemoveRobotAction,
  ADD_ZONE_BLOCK, AddZoneBlockAction,
  REMOVE_ZONE_BLOCK, RemoveZoneBlockAction,
} from '../actions';

import undoable from '@pasta/helper/lib/undoable';

function rgbToHex({ r, g, b }) {
  return (1 << 24) /* Used by mesher */ | (r << 16) | (g << 8) | b;
}

function worldDataReducer(state: WorldData, action: Action<any>): WorldData {
  switch(action.type) {
    case ADD_ROBOT: {
      const { robot } = <AddRobotAction>action;
      const robots = Object.assign({}, state.robots, {
        [robot.id]: robot,
      });
      return Object.assign({}, state, { robots });
    }
    case REMOVE_ROBOT: {
      const { robotId } = <RemoveRobotAction>action;

      const robots: { [index: string]: Robot } = {};
      Object.keys(state.robots).forEach(id => {
        if (id === robotId) return;
        robots[id] = state.robots[id];
      });
      return Object.assign({}, state, { robots });
    }
    case ADD_ZONE_BLOCK: {
      const { zoneId, x, y, z, color } = <AddZoneBlockAction>action;
      const { blocks } = state.zones[zoneId];

      const c = rgbToHex(color);
      const nextBlocks = ndarray(blocks.data.slice(), blocks.shape);
      nextBlocks.set(x, y, z, c);

      return update(state, {
        zones: { [zoneId]: { blocks: { $set: nextBlocks } } }
      });
    }
    case REMOVE_ZONE_BLOCK: {
      const { zoneId, x, y, z } = <RemoveZoneBlockAction>action;
      const { blocks } = state.zones[zoneId];

      const nextBlocks = ndarray(blocks.data.slice(), blocks.shape);
      nextBlocks.set(x, y, z, 0);

      return update(state, {
        zones: { [zoneId]: { blocks: { $set: nextBlocks } } }
      });
    }
  }
  return state;
}

export default undoable(worldDataReducer);
