import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import { MuiTheme } from 'material-ui/styles';
import * as Colors from 'material-ui/styles/colors';
const cloneDeep = require('lodash/cloneDeep');
const update = require('react-addons-update');

interface FullscreenButtonProps extends React.Props<FullscreenButton> {
  onTouchTap: () => any;
  fullscreen: boolean;
}

class FullscreenButton extends React.Component<FullscreenButtonProps, {}> {
  static contextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  };

  muiTheme: MuiTheme;

  constructor(props, context) {
    super(props, context);

    this.muiTheme = update(context.muiTheme, {
      rawTheme: { spacing: { iconSize: { $set: 36 } } },
    });
  }

  getChildContext() {
    return { muiTheme: this.muiTheme };
  }

  render() {
    return (
      <IconButton
        onTouchTap={this.props.onTouchTap}
        tooltipStyles={{ left: 5 }}
        iconStyle={{ color: Colors.white }}
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
