import * as Tools from '../../constants/Tools';
import colorize from './colorize';
import erase from './erase';
import brush from './brush';

export const toolsFactory = {
  [Tools.BRUSH]: brush,
  [Tools.ERASE]: erase,
  [Tools.COLORIZE]: colorize,
}
