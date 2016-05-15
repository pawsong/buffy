import { Ndarray } from 'ndarray';
import {
  Position,
  Direction,
} from '@pasta/core/lib/types';
const objectAssign = require('object-assign');

import {
  EditModeState,
  EditToolType,
  Robot,
} from '../types';

import {
  Action,
  CHANGE_EDIT_TOOL, ChangeEditToolAction,
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
  CHANGE_ACTIVE_ZONE, ChangeActiveZoneAction,
  REQUEST_ADD_ROBOT, RequestAddRobotAction,
  ADD_ROBOT, AddRobotAction,
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
    case REQUEST_ADD_ROBOT: {
      const { recipeId } = <RequestAddRobotAction>action;
      return Object.assign({}, state, {
        tool: EditToolType.ADD_ROBOT,
        toolToRestore: state.tool,
        addRobotRecipeId: recipeId,
      });
    }
    case ADD_ROBOT: {
      const { robot } = <AddRobotAction>action;
      const robots = Object.assign({}, state.robots);
      robots[robot.id] = robot;
      return Object.assign({}, state, {
        robots,
        tool: state.toolToRestore,
        toolToRestore: EditToolType.ADD_BLOCK,
        addRobotRecipeId: '',
      });
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
