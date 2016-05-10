import * as React from 'react';

import StateLayer from '@pasta/core/lib/StateLayer';
import { Scripts } from '@pasta/core/lib/types';
import DesignManager from '../../DesignManager';

import CardboardZoneCanvas from './CardboardZoneCanvas';

import FullscreenPlayer from '../FullscreenPlayer';

interface CardboardProps extends React.Props<Cardboard> {
  stateLayer: StateLayer;
  designManager: DesignManager;
  scripts: Scripts;
  onStart: () => any;
}

class Cardboard extends React.Component<CardboardProps, void> {
  render() {
    return (
      <FullscreenPlayer
        onStart={this.props.onStart}
        scripts={this.props.scripts}
        stateLayer={this.props.stateLayer}
        installZoneView={(element) => new CardboardZoneCanvas(element, this.props.stateLayer, this.props.designManager, '')}
      />
    );
  }
}

export default Cardboard;
