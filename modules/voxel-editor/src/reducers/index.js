import { combineReducers } from 'redux'
import { voxel, voxelOp } from './voxel'
import { color } from './color'
import { spriteFocus } from './sprite'

const rootReducer = combineReducers({
  voxel,
  voxelOp,
  color,
  spriteFocus,
})

export default rootReducer
