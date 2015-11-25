import { combineReducers } from 'redux'
import { voxel, voxelOp } from './voxel'
import { color } from './color'
import { sprite, spriteOp, spriteFocus } from './sprite'
import { workspace } from './workspace'

const rootReducer = combineReducers({
  voxel,
  voxelOp,
  color,
  sprite,
  spriteOp,
  spriteFocus,
  workspace,
})

export default rootReducer
