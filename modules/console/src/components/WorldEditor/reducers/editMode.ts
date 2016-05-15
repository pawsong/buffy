import { Ndarray } from 'ndarray';
import {
  Position,
  Direction,
} from '@pasta/core/lib/types';
const objectAssign = require('object-assign');

import {
  EditModeState,
  Robot,
} from '../types';

import {
  Action,
  CHANGE_EDIT_TOOL, ChangeEditToolAction,
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
  CHANGE_ACTIVE_ZONE, ChangeActiveZoneAction,
  REMOVE_ROBOT, RemoveRobotAction,
} from '../actions';

export function editModeReducer(state: EditModeState, action: Action<any>): EditModeState {
  switch(action.type) {
    case CHANGE_EDIT_TOOL: {
      const { tool } = <ChangeEditToolAction>action;
      return objectAssign({}, state, { tool });
    }
    case CHANGE_PALETTE_COLOR: {
      const { color } = <ChangePaletteColorAction>action;
      return objectAssign({}, state, { paletteColor: color });
    }
    case CHANGE_ACTIVE_ZONE: {
      const { zoneId } = <ChangeActiveZoneAction>action;
      return objectAssign({}, state, { activeZoneId: zoneId });
    }
    case REMOVE_ROBOT: {
      const { robotId } = <RemoveRobotAction>action;

      const robots: { [index: string]: Robot } = {};
      Object.keys(state.robots).forEach(id => {
        if (id === robotId) return;
        robots[id] = state.robots[id];
      });

      return objectAssign({}, state, { robots });
    }
  }
  return state;
}
