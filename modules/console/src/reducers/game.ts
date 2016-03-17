import * as Immutable from 'immutable';
import objectAssign = require('object-assign');
import update from '../utils/update';

import {
  CHANGE_TOOL, ChangeToolAction,
  CHANGE_COLOR, ChangeColorAction,
  OPEN_FRIENDS_DIALOG, OpenFriendsDialogAction,
  CLOSE_FRIENDS_DIALOG, CloseFriendsDialogAction,
  USERS_FETCHED, UsersFetchedAction,
} from '../actions/game';

import { Action } from '../actions';

export type ToolType = 'move';

export interface ToolState {
  type: ToolType;
}

export interface Color {
  r: number; g: number; b: number;
}

export interface BrushState {
  color: Color;
}

interface Map {
  id: string;
  name: string;
  width: number;
  depth: number;
}

interface Position {
  x: number;
  z: number;
}

export interface GameUser {
  id: string;
  name: string;
  owner: string;
  mesh: string;
  home: Map;
  loc: {
    map: string;
    pos: Position;
  },
}

export type GameUsersState = Immutable.Map<string, GameUser>;

interface GameUi {
  friendsModalOpened: boolean;
}

export interface GameState {
  tool: ToolState;
  brush: BrushState;
  users: GameUsersState;
  ui: GameUi;
}

const initialState: GameState = {
  tool: {
    type: 'move',
  },
  brush: {
    color: { r: 46, g: 204, b: 113 },
  },
  users: Immutable.Map<string, GameUser>(),
  ui: {
    friendsModalOpened: false,
  },
};

export function initialize(state = <GameState>{}): GameState {
  return objectAssign({}, state, <GameState>({
    users: Immutable.Map<string, GameUser>(state.users),
  }));
}

function tool(state: ToolState, action: Action<string>): ToolState {
  switch(action.type) {
    case CHANGE_TOOL: {
      const { toolType } = <ChangeToolAction>action;
      return update(state, {
        type: toolType,
      });
    }
    default: {
      return state;
    }
  }
}

function brush(state: BrushState, action: Action<string>): BrushState {
  switch(action.type) {
    case CHANGE_COLOR: {
      const { color } = <ChangeColorAction>action;
      return update(state, {
        color,
      });
    }
    default: {
      return state;
    }
  }
}

function users(state: GameUsersState, action: Action<any>): GameUsersState {
  switch(action.type) {
    case USERS_FETCHED: {
      const { users } = <UsersFetchedAction>(action);
      return state.withMutations(mutable => {
        users.forEach(user => mutable.set(user.id, user));
      });
    }
    default: {
      return state;
    }
  }
}

function ui(state: GameUi, action: Action<any>): GameUi {
  switch(action.type) {
    case OPEN_FRIENDS_DIALOG: {
      return update(state, {
        friendsModalOpened: true,
      });
    }
    case CLOSE_FRIENDS_DIALOG: {
      return update(state, {
        friendsModalOpened: false,
      });
    }
    default: {
      return state;
    }
  }
}

export default function game(state = initialState, action: Action<string>): GameState {
  return {
    brush: brush(state.brush, action),
    tool: tool(state.tool, action),
    users: users(state.users, action),
    ui: ui(state.ui, action),
  };
}
