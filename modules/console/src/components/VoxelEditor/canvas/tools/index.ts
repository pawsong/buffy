import * as Tools from '../../constants/Tools';
import { ToolType } from '../../interface';
import colorize from './colorize';
import erase from './erase';
import brush from './brush';

export const toolsFactory = {
  [ToolType.brush]: brush,
  [ToolType.erase]: erase,
  [ToolType.colorize]: colorize,
}
