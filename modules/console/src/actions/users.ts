import { User } from '../reducers/users';

import { Action } from './';

export const USER_ADD: 'users/USER_ADD' = 'users/USER_ADD';
export interface UserAddAction extends Action<typeof USER_ADD> {
  user: User;
}
export function userAdd(user: User): UserAddAction {
  return {
    type: USER_ADD,
    user,
  };
};

export const USER_UPDATE: 'users/USER_UPDATE' = 'users/USER_UPDATE';
export interface UserUpdateAction extends Action<typeof USER_UPDATE> {
  userId: string;
  query: Object;
}
export function userUpdate(userId: string, query: Object): UserUpdateAction {
  return {
    type: USER_UPDATE,
    userId, query,
  };
}

export const USER_REMOVE: 'users/USER_REMOVE' = 'users/USER_REMOVE';
export interface UserRemoveAction extends Action<typeof USER_REMOVE> {
  userid: string;
}
export function userRemove(userid: string): UserRemoveAction {
  return {
    type: USER_REMOVE,
    userid,
  };
}
