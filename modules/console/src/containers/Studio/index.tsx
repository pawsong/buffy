import * as React from 'react';
import { connect } from 'react-redux';
import Toolbar = require('material-ui/lib/toolbar/toolbar');
import ToolbarGroup = require('material-ui/lib/toolbar/toolbar-group');
import RaisedButton = require('material-ui/lib/raised-button');
import Tabs = require('material-ui/lib/tabs/tabs');
import Tab = require('material-ui/lib/tabs/tab');
import objectAssign = require('object-assign');
import update = require('react-addons-update');

import StateLayer from '@pasta/core/lib/StateLayer';
import { Blockly } from './containers/CodeEditor/blockly';

import * as StorageKeys from '../../constants/StorageKeys';
import { State } from '../../reducers';

import { Provider } from '../stateLayer';

import { saga, SagaProps, ImmutableTask } from '../../saga';
import rootSaga from './sagas';

import {
  requestRunBlockly,
} from '../../actions/codeEditor';
import { Layout, LayoutContainer } from '../../components/Layout';

import Game from './containers/Game';
import CodeEditor from './containers/CodeEditor';
import VoxelEditor from './containers/VoxelEditor';

/*
 * Component
 */

const styles = {
  root: {

  },
  profile: {
    position: 'absolute',
    top: -4,
    right: 50,
    zIndex: 1500,
  },
  content: {
    position: 'absolute',
    // top: NAVBAR_HEIGHT,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  addon: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    left: 0,
    right: 0,
  },
  fillParent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  game: {
    margin: 'auto',
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
  overlayInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
};

interface StudioProps extends React.Props<Studio> {
  onRun: () => any;
  isBlocklyReady: boolean;
  style?: React.CSSProperties;
}

interface StudioState {
  gameSizeVersion?: number;
  editorSizeVersions?: {
    code: number;
    design: number;
  }
  activeTab?: string;
}

class Studio extends React.Component<StudioProps, StudioState> {
  initialTabIndex: number;
  initialGameWidth: number;
  initialGameHeight: number;

  activeTabName: string;
  socket: SocketIOClient.Socket;

  constructor(props, context) {
    super(props, context);
    this.state = {
      editorSizeVersions: {
        code: 0,
        design: 0,
      },
      gameSizeVersion: 0,
      activeTab: localStorage.getItem(StorageKeys.MASTER_INITIAL_TAB) || 'code',
    };
  }

  componentWillMount() {
    this.initialGameWidth = parseInt(localStorage.getItem(StorageKeys.MASTER_GAME_WIDTH_SIZE) || 600, 10);
    this.initialGameHeight = parseInt(localStorage.getItem(StorageKeys.MASTER_GAME_HEIGHT_SIZE) || 480, 10);
  }

  handleGameWidthResize(size) {
    localStorage.setItem(StorageKeys.MASTER_GAME_WIDTH_SIZE, `${size}`);

    // Resize game & editor
    this.setState(update(this.state, {
      gameSizeVersion: { $set: this.state.gameSizeVersion + 1 },
      editorSizeVersions: {
        [this.state.activeTab]: { $set: this.state.editorSizeVersions[this.state.activeTab] + 1 },
      },
    }));
  }

  handleGameHeightResize(size) {
    localStorage.setItem(StorageKeys.MASTER_GAME_HEIGHT_SIZE, `${size}`);

    // Resize game only
    this.setState({
      gameSizeVersion: this.state.gameSizeVersion + 1,
    });
  }

  onTabChange(value) {
    this.setState(update(this.state, {
      activeTab: { $set: value },
      editorSizeVersions: {
        [value]: { $set: this.state.editorSizeVersions[value] + 1 },
      },
    }));
    localStorage.setItem(StorageKeys.MASTER_INITIAL_TAB, value);
  }

  render() {
    const rootStyle = objectAssign({}, styles.root, this.props.style);
    return (
      <div style={rootStyle}>
        <Layout flow="row" style={styles.content}>
          <LayoutContainer size={this.initialGameWidth} onResize={size => this.handleGameWidthResize(size)}>
            <Layout flow="column" style={styles.fillParent}>
              <LayoutContainer size={this.initialGameHeight} onResize={size => this.handleGameHeightResize(size)}>
                <Game sizeVersion={this.state.gameSizeVersion}/>
              </LayoutContainer>
              <LayoutContainer remaining={true}>
                <Toolbar>
                  <ToolbarGroup key={0} float="right">
                    <RaisedButton label="Run"
                                  primary={true}
                                  disabled={!this.props.isBlocklyReady}
                                  onClick={() => this.props.onRun()}
                    />
                  </ToolbarGroup>
                </Toolbar>
              </LayoutContainer>
            </Layout>
          </LayoutContainer>

          <LayoutContainer remaining={true}>
            <Tabs contentContainerStyle={styles.addon}
                  tabTemplate={TabTemplate}
                  onChange={value => this.onTabChange(value)}
                  value={this.state.activeTab}
            >
              <Tab label={'Code'} value="code">
                <CodeEditor sizeVersion={this.state.editorSizeVersions.code} active={this.state.activeTab === 'code'} />
              </Tab>
              <Tab label={'Design'} value="design">
                <VoxelEditor sizeVersion={this.state.editorSizeVersions.design} />
              </Tab>
            </Tabs>
          </LayoutContainer>
        </Layout>
      </div>
    );
  }
}

interface TabTemplateProps extends React.Props<TabTemplate> {
  selected: boolean;
}

class TabTemplate extends React.Component<TabTemplateProps, {}> {
  render() {
    const styles: {
      width: string;
      height: string;
      display?: string;
    } = {
      'width': '100%',
      'height': '100%',
    };

    if (!this.props.selected) {
      styles.display = 'none';
    }

    return (
      <div style={styles}>
        {this.props.children}
      </div>
    );
  }
};

/*
 * Container
 */

interface StudioContainerProps extends React.Props<{}>, SagaProps {
  stateLayer: StateLayer;
  blocklyWorkspace?: any;
  style?: React.CSSProperties;
  requestRunBlockly?: (workspace: any) => any;
  root?: ImmutableTask<any>;
}

interface StudioContainerState {
  mount?: boolean;
}

@saga({
  root: rootSaga,
})
@connect((state: State) => ({
  blocklyWorkspace: state.codeEditor.workspace,
}), {
  requestRunBlockly,
})
class StudioContainer extends React.Component<StudioContainerProps, StudioContainerState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      mount: false,
    };
  }

  componentDidMount() {
    this.setState({ mount: true });
    this.props.runSaga(this.props.root);
  }

  componentWillUnmount() {
    this.setState({ mount: false });
    this.props.cancelSaga(this.props.root);
  }

  handleRun() {
    const workspace = this.props.blocklyWorkspace;
    if (!workspace) {
      return console.error('Workspace is empty');
    }
    this.props.requestRunBlockly(workspace);
  }

  render() {
    if (!this.state.mount) {
      return <div>Loading...</div>;
    }

    if (!this.props.stateLayer) {
      return <div>Connecting...</div>;
    }

    return (
      <Provider stateLayer={this.props.stateLayer}>
        <Studio style={this.props.style}
                    onRun={() => this.handleRun()}
                    isBlocklyReady={!!this.props.blocklyWorkspace}
        />
      </Provider>
    );
  }
}

export default StudioContainer;
