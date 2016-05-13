import * as React from 'react';

import StateLayer from '@pasta/core/lib/StateLayer';
import { Scripts } from '@pasta/core/lib/types';

import GameZoneCanvas from './GameZoneCanvas';

import DesignManager from '../../canvas/DesignManager';
import FullscreenPlayer from '../FullscreenPlayer';

interface GameProps extends React.Props<Game> {
  stateLayer: StateLayer;
  designManager: DesignManager;
  scripts: Scripts;
  onStart: () => any;
}

class Game extends React.Component<GameProps, void> {
  render() {
    return null;
    // return (
    //   <FullscreenPlayer
    //     onStart={this.props.onStart}
    //     scripts={this.props.scripts}
    //     stateLayer={this.props.stateLayer}
    //     installZoneView={(element) => new GameZoneCanvas(element, this.props.stateLayer, this.props.designManager, '')}
    //   />
    // );
  }
}

export default Game;
