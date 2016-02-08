import { combineReducers } from 'redux';

import { tool } from './tool';

const rootReducer = combineReducers({
  tool: tool,
});

export default rootReducer;
