import * as React from 'react';
import {
  IconButton,
  Styles,
} from 'material-ui';

const {
  ThemeManager,
  LightRawTheme,
  ThemeDecorator,
} = Styles;

class FullscreenButton extends React.Component<{ 
  onClick();
  style: {};
  fullscreen: boolean;
}, {}> {
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  };
  
  getChildContext() {
    const CustomRawTheme = _.cloneDeep(LightRawTheme);
    CustomRawTheme.spacing.iconSize = 36;
    return { muiTheme: ThemeManager.getMuiTheme(CustomRawTheme) };
  };
  
  render() {
    return <IconButton
      onClick={this.props.onClick}
      tooltipStyles={{ left: 5 }}
      style={this.props.style} iconClassName="material-icons" tooltipPosition="bottom-center"
      tooltip={this.props.fullscreen ? 'Fullscreen exit' : 'Fullscreen'}
      >
      {this.props.fullscreen ? 'fullscreen_exit' : 'fullscreen'}
    </IconButton>
  }
}

export default FullscreenButton;