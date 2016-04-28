import * as React from 'react';

import StateLayer from '@pasta/core/lib/StateLayer';
import { Scripts } from '@pasta/core/lib/types';

import GameZoneView from './GameZoneView';

import FullscreenPlayer from '../FullscreenPlayer';

interface GameProps extends React.Props<Game> {
  stateLayer: StateLayer;
  scripts: Scripts;
  onStart: () => any;
}

class Game extends React.Component<GameProps, void> {
  render() {
    return (
      <FullscreenPlayer
        onStart={this.props.onStart}
        scripts={this.props.scripts}
        stateLayer={this.props.stateLayer}
        installZoneView={(element) => new GameZoneView(element, this.props.stateLayer)}
      />
    );
  }
}

export default Game;
