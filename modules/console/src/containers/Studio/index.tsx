import './patch';

import * as React from 'react';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import RaisedButton from 'material-ui/lib/raised-button';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
const objectAssign = require('object-assign');
const update = require('react-addons-update');
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import StateLayer from '@pasta/core/lib/StateLayer';
import Blockly from '../../blockly';

import * as StorageKeys from '../../constants/StorageKeys';
import { State } from '../../reducers';

import { Sandbox, Scripts } from '../../sandbox';

import { saga, SagaProps, ImmutableTask } from '../../saga';
import rootSaga, { runBlocklyWorkspace, submitVoxel } from './sagas';

import { Layout, LayoutContainer } from '../../components/Layout';

import Game from './containers/Game';
import CodeEditor, { CodeEditorState } from '../../components/CodeEditor';
import { convertXmlToCodes } from '../../blockly/utils';

import VoxelEditor from './containers/VoxelEditor';

const messages = defineMessages({
  run: {
    id: 'run',
    description: 'Run code',
    defaultMessage: 'Run',
  },
  stop: {
    id: 'stop',
    description: 'Stop code',
    defaultMessage: 'Stop',
  },
  code: {
    id: 'code',
    description: 'Write code for robot with blocks',
    defaultMessage: 'Code',
  },
  design: {
    id: 'design',
    description: 'Design robot with blocks',
    defaultMessage: 'Design',
  },
});

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

export interface StudioState {
  codeEditorState: CodeEditorState;
}

interface StudioBodyProps extends React.Props<Studio>, SagaProps {
  studioState: StudioState;
  onChange: (nextState: StudioState) => any;

  stateLayer: StateLayer;
  initialBlocklyXml: string;
  style?: React.CSSProperties;
  intl?: InjectedIntlProps;
  root?: ImmutableTask<any>;
  run?: ImmutableTask<any>;
  submitVoxel?: ImmutableTask<any>;
}

interface StudioBodyState {
  gameSizeVersion?: number;
  editorSizeVersions?: {
    code: number;
    design: number;
  }
  activeTab?: string;
}

@injectIntl
@saga({
  root: rootSaga,
  run: runBlocklyWorkspace,
  submitVoxel: submitVoxel,
})
class StudioBody extends React.Component<StudioBodyProps, StudioBodyState> {
  initialTabIndex: number;
  initialGameWidth: number;
  initialGameHeight: number;

  activeTabName: string;

  sandbox: Sandbox;

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

    this.sandbox = new Sandbox(this.props.stateLayer);
  }

  componentDidMount() {
    this.props.runSaga(this.props.root);
  }

  componentWillUnmount() {
    this.props.cancelSaga(this.props.root);
    this.props.cancelSaga(this.props.run);
  }

  handleRun() {
    const scripts = convertXmlToCodes(this.props.studioState.codeEditorState.blocklyXml);
    this.props.runSaga(this.props.run, this.sandbox, scripts);
  }

  handleStop() {
    this.props.cancelSaga(this.props.run);
  }

  handleVoxelEditorSubmit(data) {
    this.props.runSaga(this.props.submitVoxel, this.props.stateLayer, data);
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

  handleCodeEditorChange(codeEditorState: CodeEditorState) {
    this.props.onChange(objectAssign({}, this.props.studioState, {
      codeEditorState
    }));
  }

  render() {
    const rootStyle = objectAssign({}, styles.root, this.props.style);
    const controlButton = this.props.run.state === 'running'
      ? <RaisedButton label={this.props.intl.formatMessage(messages.stop)}
                      secondary={true}
                      onTouchTap={() => this.handleStop()}
        />
      : <RaisedButton label={this.props.intl.formatMessage(messages.run)}
                      primary={true}
                      onTouchTap={() => this.handleRun()}
        />;

    return (
      <div style={rootStyle}>
        <Layout flow="row" style={styles.content}>
          <LayoutContainer size={this.initialGameWidth} onResize={size => this.handleGameWidthResize(size)}>
            <Layout flow="column" style={styles.fillParent}>
              <LayoutContainer size={this.initialGameHeight} onResize={size => this.handleGameHeightResize(size)}>
                <Game sizeVersion={this.state.gameSizeVersion} stateLayer={this.props.stateLayer} />
              </LayoutContainer>
              <LayoutContainer remaining={true}>
                <Toolbar>
                  <ToolbarGroup key={0} float="right">
                    {controlButton}
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
              <Tab label={this.props.intl.formatMessage(messages.code)} value="code">
                <CodeEditor editorState={this.props.studioState.codeEditorState}
                            onChange={codeEditorState => this.handleCodeEditorChange(codeEditorState)}
                            sizeRevision={this.state.editorSizeVersions.code}
                            readyToRender={this.state.activeTab === 'code'}
                />
              </Tab>
              <Tab label={this.props.intl.formatMessage(messages.design)} value="design">
                <VoxelEditor sizeVersion={this.state.editorSizeVersions.design}
                             onSubmit={(data) => this.handleVoxelEditorSubmit(data)}
                />
              </Tab>
            </Tabs>
          </LayoutContainer>
        </Layout>
      </div>
    );
  }
}

interface StudioProps extends React.Props<Studio> {
  studioState: StudioState;
  onChange: (nextState: StudioState) => any;

  stateLayer: StateLayer;
  style?: React.CSSProperties;
  initialBlocklyXml?: string;
}

interface StudioOwnState {
  mount?: boolean;
}

const defaultStudioState: StudioState = {
  codeEditorState: CodeEditor.creatState(),
};

class Studio extends React.Component<StudioProps, StudioOwnState> {
  static creatState(initialState?: StudioState): StudioState {
    if (!initialState) return defaultStudioState;

    return {
      codeEditorState: CodeEditor.creatState(initialState && initialState.codeEditorState),
    };
  }

  constructor(props) {
    super(props);
    this.state = { mount: false };
  }

  componentDidMount() {
    this.setState({ mount: true });
  }

  componentWillUnmount() {
    this.setState({ mount: false });
  }

  render() {
    if (!this.state.mount) {
      return <div>Loading...</div>;
    }

    return (
      <StudioBody studioState={this.props.studioState}
                  onChange={this.props.onChange}
                  stateLayer={this.props.stateLayer} style={this.props.style}
                  initialBlocklyXml={this.props.initialBlocklyXml}
      />
    );
  };
}

export default Studio;
