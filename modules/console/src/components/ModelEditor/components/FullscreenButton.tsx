import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import { MuiTheme } from 'material-ui/styles';
import * as Colors from 'material-ui/styles/colors';
const cloneDeep = require('lodash/cloneDeep');
const update = require('react-addons-update');

const styles = {
  root: {
    position: 'absolute',
    right: 20,
    bottom: 30,
  },
};

interface FullscreenButtonProps extends React.Props<FullscreenButton> {
  onTouchTap: () => any;
  fullscreen: boolean;
}

class FullscreenButton extends React.Component<FullscreenButtonProps, {}> {
  render() {
    return (
      <IconButton
        onTouchTap={this.props.onTouchTap}
        iconStyle={{
          color: Colors.white,
          transform: 'scale(1.32)',
        }}
        style={styles.root} iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={this.props.fullscreen ? 'Fullscreen exit' : 'Fullscreen'}
        tooltipStyles={{
          top: 30,
        }}
      >
        {this.props.fullscreen ? 'fullscreen_exit' : 'fullscreen'}
      </IconButton>
    );
  }
}

export default FullscreenButton;
