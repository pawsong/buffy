import React from 'react';
import {
  IconButton,
  Styles,
} from 'material-ui';

const {
  ThemeManager,
  LightRawTheme,
  ThemeDecorator,
} = Styles;

const FullscreenButton = React.createClass({
  //the key passed through context must be called "muiTheme"
  childContextTypes : {
    muiTheme: React.PropTypes.object,
  },

  getChildContext() {
    const CustomRawTheme = _.cloneDeep(LightRawTheme);
    CustomRawTheme.spacing.iconSize = 36;
    return { muiTheme: ThemeManager.getMuiTheme(CustomRawTheme) };
  },

  render() {
    return <IconButton
      onClick={this.props.onClick}
      tooltipStyles={{ left: 5 }}
      style={this.props.style} iconClassName="material-icons" tooltipPosition="bottom-center"
      tooltip={this.props.fullscreen ? 'Fullscreen exit' : 'Fullscreen'}
      >
      {this.props.fullscreen ? 'fullscreen_exit' : 'fullscreen'}
    </IconButton>
  },
});

export default FullscreenButton;
