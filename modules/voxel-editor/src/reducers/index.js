import { combineReducers } from 'redux'
import { voxel, voxelOp } from './voxel'
import { color } from './color'
import { sprite, spriteOp, spriteFocus } from './sprite'
import { workspace } from './workspace'
import { tool } from './tool'

const rootReducer = combineReducers({
  voxel,
  voxelOp,
  color,
  workspace,
  tool,
})

export default rootReducer
