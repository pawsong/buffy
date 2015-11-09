import {
  SET_USER_DATA,
} from '../constants/ActionTypes'

export default function user(state = null, action) {
  switch (action.type) {
    case SET_USER_DATA:
      return action.user;
    default:
      return state;
  }
}
