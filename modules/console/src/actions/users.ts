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
