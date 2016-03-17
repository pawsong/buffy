import * as React from 'react';
import { connect } from 'react-redux';
import StateLayer from '@pasta/core/lib/StateLayer';
import { EventSubscription } from 'fbemitter';
import { connect as connectStateLayer } from '../../../../containers/stateLayer';

import { State } from '../../../../reducers';
import {
  ToolState,
  BrushState,
  GameUsersState,
  ToolType,
  Color,
} from '../../../../reducers/game';
import {
  changeTool,
  changeColor,
  openFriendsDialog,
  closeFriendsDialog,
  requestWarp,
} from '../../../../actions/game';
import MapInfo from './components/MapInfo';
import Canvas from './components/Canvas';
import ContactsButton from './components/ContactsButton';
import Tools from './components/Tools';
import ContactsDialog from './components/ContactsDialog';

interface GameProps extends React.Props<Game> {
  sizeVersion: number; // For resize

  stateLayer?: StateLayer;
  tool?: ToolState;
  brush?: BrushState;
  changeTool?: (type: ToolType) => any;
  changeColor?: (color: Color) => any;
  openFriendsDialog?: () => any;
  closeFriendsDialog?: () => any;
  friendsModalOpened?: boolean;
  users?: GameUsersState;
  requestWarp?: (targetMapId: string) => any;
}

interface GameState {
  mapName: string;
}

@connectStateLayer()
@connect((state: State) => ({
  tool: state.game.tool,
  brush: state.game.brush,
  friendsModalOpened: state.game.ui.friendsModalOpened,
  users: state.game.users,
}), {
  changeTool,
  changeColor,
  openFriendsDialog,
  closeFriendsDialog,
  requestWarp,
})
class Game extends React.Component<GameProps, GameState> {

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

  handleContactsButtonClick() {
    this.props.openFriendsDialog();
  }

  handleContactsDialogClose() {
    this.props.closeFriendsDialog();
  }

  handleContactsDialogSubmit(mapId) {
    this.props.requestWarp(mapId);
  }

  render() {
    return (
      <div>
        <MapInfo mapName={this.state.mapName} />
        <Canvas sizeVersion={this.props.sizeVersion}/>
        <ContactsButton onTouchTap={() => this.handleContactsButtonClick()} />
        <Tools tool={this.props.tool}
               brush={this.props.brush}
               changeColor={this.props.changeColor}
               changeTool={this.props.changeTool}
        />
        <ContactsDialog open={this.props.friendsModalOpened}
                        friends={this.props.users.toArray()}
                        onSubmit={mapId => this.handleContactsDialogSubmit(mapId)}
                        onClose={() => this.handleContactsDialogClose()}
        />
      </div>
    );
  }
}

export default Game;
