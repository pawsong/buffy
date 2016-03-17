import * as Immutable from 'immutable';
import update from '../utils/update';
import { Action } from '../actions';
import {
  USER_ADD, UserAddAction,
  USER_REMOVE, UserRemoveAction,
} from '../actions/users';

export interface User {
  id: string;
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
        picture: user.picture,
      });
    }
    case USER_REMOVE: {
      const { userid } = <UserRemoveAction>action;
      return state.remove(userid);
    }
    default: {
      return state;
    }
  }
}
