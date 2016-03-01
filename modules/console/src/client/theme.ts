import * as Layout from './constants/Layout';

const ThemeManager = require('material-ui/lib/styles/theme-manager');
const LightRawTheme = require('material-ui/lib/styles/raw-themes/light-raw-theme');

const theme = ThemeManager.getMuiTheme(LightRawTheme, {
  appBar: {
    height: Layout.NAVBAR_HEIGHT,
  }
});

export default theme;
