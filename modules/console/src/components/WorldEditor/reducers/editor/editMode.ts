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
} from '../../types';

import {
  Action,
  CHANGE_EDIT_TOOL, ChangeEditToolAction,
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
  CHANGE_ACTIVE_ZONE, ChangeActiveZoneAction,
  REQUEST_ADD_ROBOT, RequestAddRobotAction,
  ADD_ROBOT, AddRobotAction,
  REMOVE_ROBOT, RemoveRobotAction,
  RUN_SCRIPT, RunScriptAction,
  STOP_SCRIPT, StopScriptAction,
} from '../../actions';

const initialState: EditModeState = {
  tool: EditToolType.MOVE,
  activeZoneId: '',
  paletteColor: { r: 104, g: 204, b: 202 },
  addRobotRecipeId: '',
  toolToRestore: EditToolType.MOVE,
  scriptIsRunning: false,
};

export function editModeReducer(state = initialState, action: Action<any>): EditModeState {
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
    case RUN_SCRIPT: {
      return objectAssign({}, state, { scriptIsRunning: true });
    }
    case STOP_SCRIPT: {
      return objectAssign({}, state, { scriptIsRunning: false });
    }
  }
  return state;
}
