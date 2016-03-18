import Colors from 'material-ui/lib/styles/colors';
import ColorManipulator from 'material-ui/lib/utils/color-manipulator';
import Spacing from 'material-ui/lib/styles/spacing';
const zIndex = require('material-ui/lib/styles/zIndex');
const lightBaseTheme = require('material-ui/lib/styles/baseThemes/lightBaseTheme');

// import { NAVBAR_HEIGHT } from './constants/Layout';

// export const baseTheme = {
//   spacing: Spacing,
//   zIndex: zIndex,
//   fontFamily: 'Roboto, sans-serif',
//   palette: {
//     // primary1Color: Colors.cyan500,
//     primary1Color: Colors.cyan200,
//     primary2Color: Colors.cyan700,
//     primary3Color: Colors.lightBlack,
//     accent1Color: Colors.pinkA200,
//     accent2Color: Colors.grey100,
//     accent3Color: Colors.grey500,
//     textColor: Colors.darkBlack,
//     alternateTextColor: Colors.white,
//     canvasColor: Colors.white,
//     borderColor: Colors.grey300,
//     disabledColor: ColorManipulator.fade(Colors.darkBlack, 0.3),
//     pickerHeaderColor: Colors.cyan500,
//   }
// }
export const baseTheme = lightBaseTheme;

export const muiTheme = {
  // appBar: {
  //   height: /* NAVBAR_HEIGHT */ * 4,
  // },
};
