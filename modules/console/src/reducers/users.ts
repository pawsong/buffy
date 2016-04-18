import * as Immutable from 'immutable';
import update from '../utils/update';
const objectAssign = require('object-assign');
import { Action } from '../actions';
import {
  USER_ADD, UserAddAction,
  USER_UPDATE, UserUpdateAction,
  USER_REMOVE, UserRemoveAction,
} from '../actions/users';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  picture: string;
}

export type UsersState = Immutable.Map<string, User>;

export function initialize(initialState?): UsersState {
  return Immutable.Map<string, User>(initialState);
}

export default function users(state: UsersState = initialize(), action: Action<string>): UsersState {
  switch (action.type) {
    case USER_ADD: {
      const { user } = <UserAddAction>action;
      return state.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture,
      });
    }
    case USER_REMOVE: {
      const { userid } = <UserRemoveAction>action;
      return state.remove(userid);
    }
    case USER_UPDATE: {
      const { userId, query } = <UserUpdateAction>action;
      const user = state.get(userId);
      if (!user) return state;
      return state.set(userId, objectAssign({}, user, query));
    }
    default: {
      return state;
    }
  }
}
