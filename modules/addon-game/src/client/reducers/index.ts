import { combineReducers } from 'redux';

import { tool } from './tool';
import { brush } from './brush';

const rootReducer = combineReducers({
  brush: brush,
  tool: tool,
});

export default rootReducer;
