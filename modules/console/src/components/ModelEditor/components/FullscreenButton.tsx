import React from 'react';
import IconButton from 'material-ui/IconButton';
import { white } from 'material-ui/styles/colors';

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
      <div style={styles.root}>
        <IconButton
          onTouchTap={this.props.onTouchTap}
          iconStyle={{
            color: white,
            transform: 'scale(1.32)',
          }}
          iconClassName="material-icons" tooltipPosition="bottom-center"
          tooltip={this.props.fullscreen ? 'Fullscreen exit' : 'Fullscreen'}
          tooltipStyles={{
            top: 30,
          }}
        >
          {this.props.fullscreen ? 'fullscreen_exit' : 'fullscreen'}
        </IconButton>
      </div>
    );
  }
}

export default FullscreenButton;
