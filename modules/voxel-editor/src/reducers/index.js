import { combineReducers } from 'redux'
import { voxel, voxelOp } from './voxel'
import { color } from './color'

const rootReducer = combineReducers({
  voxel,
  voxelOp,
  color,
})

export default rootReducer
