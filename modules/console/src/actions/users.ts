import { User } from '../reducers/users';

import { Action } from './';

export const USER_ADD: 'users/USER_ADD' = 'users/USER_ADD';
export interface UserAddAction extends Action<typeof USER_ADD> {
  user: User;
}

export const USER_REMOVE: 'users/USER_REMOVE' = 'users/USER_REMOVE';
export interface UserRemoveAction extends Action<typeof USER_REMOVE> {
  userid: string;
}
