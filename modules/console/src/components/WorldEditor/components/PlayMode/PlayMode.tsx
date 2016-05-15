import * as React from 'react';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./PlayMode.css');

import {
  changePlayState,
  changePlayViewMode,
} from '../../actions';

import {
  WorldEditorState,
  PlayState,
  ViewMode,
  PlayModeState,
  DispatchAction,
} from '../../types';
import { TOOLBAR_HEIGHT } from '../../Constants';

import PlayModeSwitch from './PlayModeSwitch';

interface PlayModeProps extends React.Props<PlayMode> {
  canvasElement: HTMLElement;
  playModeState: PlayModeState;
  dispatchAction: DispatchAction;
}

const inlineStyles = {
  blocker: {
    position: 'absolute',
    top: TOOLBAR_HEIGHT,
    left: 0,
    bottom: 0,
    right: 0,
  },
}

@withStyles(styles)
class PlayMode extends React.Component<PlayModeProps, {}> {
  handleViewModeChange(viewMode: ViewMode) {
    this.props.dispatchAction(changePlayViewMode(viewMode));
  }

  handlePlayStateChange(playState: PlayState) {
    this.props.dispatchAction(changePlayState(playState));
  }

  handleKeyDown = (event: KeyboardEvent) => {
    switch(event.keyCode) {
      case 27: {
        this.handlePlayStateChange(PlayState.READY);
        break;
      }
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown, false);
  }

  render() {
    const blocker = this.props.playModeState.state === PlayState.READY ? (
      <div style={inlineStyles.blocker}>
        <PlayModeSwitch
          canvasElement={this.props.canvasElement}
          onViewModeChange={viewMode => this.handleViewModeChange(viewMode)}
          onPlayStart={() => this.handlePlayStateChange(PlayState.PLAY)}
        />
      </div>
    ) : null;

    return (
      <div>
        {blocker}
      </div>
    );
  }
}

export default PlayMode;
