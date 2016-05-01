import * as React from 'react';
import IconButton from 'material-ui/lib/icon-button';
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
const cloneDeep = require('lodash/cloneDeep');

interface FullscreenButtonProps extends React.Props<FullscreenButton> {
  onTouchTap: () => any;
  fullscreen: boolean;
}

class FullscreenButton extends React.Component<FullscreenButtonProps, {}> {
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  };

  getChildContext() {
    const CustomRawTheme = cloneDeep(LightRawTheme);
    CustomRawTheme.spacing.iconSize = 36;
    return { muiTheme: ThemeManager.getMuiTheme(CustomRawTheme) };
  };

  render() {
    return (
      <IconButton
        onTouchTap={this.props.onTouchTap}
        tooltipStyles={{ left: 5 }}
        style={styles.root} iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={this.props.fullscreen ? 'Fullscreen exit' : 'Fullscreen'}
      >
        {this.props.fullscreen ? 'fullscreen_exit' : 'fullscreen'}
      </IconButton>
    );
  }
}

const styles = {
  root: {
    position: 'absolute',
    bottom: 10,
  },
};

export default FullscreenButton;
