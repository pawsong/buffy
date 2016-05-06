import * as React from 'react';
const pure = require('recompose/pure').default;

import StateLayer from '@pasta/core/lib/StateLayer';
import { EventSubscription } from 'fbemitter';

import DesignManager from '../../DesignManager';

import MapInfo from './components/MapInfo';
import Canvas from './components/Canvas';
import Tools from './components/Tools';

import { ToolType, Color, GameState } from './interface';
export { GameState };

const objectAssign = require('object-assign');

interface GameProps extends React.Props<Game> {
  gameState: GameState;
  onChange: (gameState: GameState) => any;
  stateLayer: StateLayer;
  designManager: DesignManager;
  sizeVersion: number; // For resize
}

interface GameOwnState {
  mapName: string;
}

@pure
class Game extends React.Component<GameProps, GameOwnState> {
  static createState: () => GameState;

  token: EventSubscription;

  constructor(props, context) {
    super(props, context);
    this.state = {
      mapName: '',
    };
  }

  componentDidMount() {
    this.token = this.props.stateLayer.store.subscribe.resync(() => {
      this.setState({ mapName: this.props.stateLayer.store.map.id });
    });
    this.setState({ mapName: this.props.stateLayer.store.map.id });
  }

  componentWillUnmount() {
    this.token.remove();
  }

  handleChangeState(nextState: GameState) {
    this.props.onChange(objectAssign({}, this.props.gameState, nextState));
  }

  render() {
    return (
      <div>
        <MapInfo mapName={this.state.mapName} />
        <Canvas gameState={this.props.gameState}
                sizeVersion={this.props.sizeVersion}
                stateLayer={this.props.stateLayer}
                designManager={this.props.designManager}
        />
        <Tools selectedTool={this.props.gameState.selectedTool}
               brushColor={this.props.gameState.brushColor}
               changeTool={selectedTool => this.handleChangeState({ selectedTool })}
               changeBrushColor={brushColor => this.handleChangeState({ brushColor })}
        />
        {this.props.children}
      </div>
    );
  }
}

Game.createState = (): GameState => {
  return {
    selectedTool: ToolType.move,
    brushColor: { r: 104, g: 204, b: 202 },
  };
}

export default Game;
