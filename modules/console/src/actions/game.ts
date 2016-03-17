import { Action } from './';

import {
  ToolType,
  Color,
  GameUser,
} from '../reducers/game';

export const CHANGE_TOOL: 'game/CHANGE_TOOL' = 'game/CHANGE_TOOL';
export interface ChangeToolAction extends Action<typeof CHANGE_TOOL> {
  toolType: ToolType;
}
export function changeTool(toolType: ToolType) {
  return {
    type: CHANGE_TOOL,
    toolType,
  }
}

export const CHANGE_COLOR: 'game/CHANGE_COLOR' = 'game/CHANGE_COLOR';
export interface ChangeColorAction extends Action<typeof CHANGE_COLOR> {
  color: Color;
}
export function changeColor(color: Color) {
  return {
    type: CHANGE_COLOR,
    color,
  };
}

export const FETCH_FRIENDS: 'game/FETCH_FRIENDS' = 'game/FETCH_FRIENDS';
export interface FetchFriednsAction extends Action<typeof FETCH_FRIENDS> {
  userId: string;
}
export function fetchFriends(userId: string) {
  return {
    type: FETCH_FRIENDS,
    userId,
  };
}

export const USERS_FETCHED: 'game/USERS_FETCHED' = 'game/USERS_FETCHED';
export interface UsersFetchedAction extends Action<typeof USERS_FETCHED> {
  users: GameUser[];
}

export const OPEN_FRIENDS_DIALOG: 'game/OPEN_FRIENDS_DIALOG' = 'game/OPEN_FRIENDS_DIALOG';
export interface OpenFriendsDialogAction extends Action<typeof OPEN_FRIENDS_DIALOG> {
}
export function openFriendsDialog(): OpenFriendsDialogAction  {
  return {
    type: OPEN_FRIENDS_DIALOG,
  };
}

export const CLOSE_FRIENDS_DIALOG: 'game/CLOSE_FRIENDS_DIALOG' = 'game/CLOSE_FRIENDS_DIALOG';
export interface CloseFriendsDialogAction extends Action<typeof CLOSE_FRIENDS_DIALOG> {
}
export function closeFriendsDialog(): CloseFriendsDialogAction  {
  return {
    type: CLOSE_FRIENDS_DIALOG,
  };
}

export const REQUEST_WARP: 'game/REQUEST_WARP' = 'game/REQUEST_WARP';
export interface RequestWarpAction extends Action<typeof REQUEST_WARP> {
  targetMapId: string;
}
export function requestWarp(targetMapId: string): RequestWarpAction  {
  return {
    type: REQUEST_WARP,
    targetMapId,
  };
}
