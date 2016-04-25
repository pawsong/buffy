import './patch';

import * as React from 'react';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import RaisedButton from 'material-ui/lib/raised-button';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import IconButton from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';
const objectAssign = require('object-assign');
const update = require('react-addons-update');
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import StateLayer from '@pasta/core/lib/StateLayer';
import Blockly from '../../blockly';
import * as StorageKeys from '../../constants/StorageKeys';
import { Sandbox, Scripts } from '../../sandbox';

import { saga, SagaProps, ImmutableTask } from '../../saga';
import { runBlocklyWorkspace, submitVoxel } from './sagas';

import { Layout, LayoutContainer } from '../../components/Layout';

import Game, {
  GameState,
} from '../../components/Game';
import CodeEditor, {
  CodeEditorState,
  CreateStateOptions as CreateCodeEditorStateOptions,
} from '../../components/CodeEditor';
import VoxelEditor, {
  VoxelEditorState,
  CreateStateOptions as CreateVoxelEditorStateOptions,
} from '../../components/VoxelEditor';

import { convertXmlToCodes } from '../../blockly/utils';

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

const FILE_CATEROGY_BUTTON_CONTAINER_WIDTH = 60;

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
  fileCategoryButtonContainer: {
    position: 'absolute',
    width: FILE_CATEROGY_BUTTON_CONTAINER_WIDTH,
    textAlign: 'center',
    backgroundColor: Colors.grey200,
    top: 0,
    bottom: 0,
  },
  fileCategoryButton: {
    margin: 2,
  },
  editor: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: FILE_CATEROGY_BUTTON_CONTAINER_WIDTH,
    right: 0,
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
  codeEditorState?: CodeEditorState;
  gameState?: GameState;
  voxelEditorState?: VoxelEditorState;
}

interface StudioBodyProps extends React.Props<Studio>, SagaProps {
  studioState: StudioState;
  onChange: (nextState: StudioState) => any;

  game: React.ReactElement<any>;

  stateLayer: StateLayer;
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

  componentWillUnmount() {
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

  handleStateChange(nextState: StudioState) {
    this.props.onChange(objectAssign({}, this.props.studioState, nextState));
  }

  renderCodeEditor() {
    return (
      <CodeEditor
        editorState={this.props.studioState.codeEditorState}
        onChange={codeEditorState => this.handleStateChange({ codeEditorState })}
        sizeRevision={this.state.editorSizeVersions.code}
        readyToRender={this.state.activeTab === 'code'}
      />
    );
  }

  renderDesignEditor() {
    return (
      <VoxelEditor
        editorState={this.props.studioState.voxelEditorState}
        onChange={voxelEditorState => this.handleStateChange({ voxelEditorState })}
        sizeVersion={this.state.editorSizeVersions.design}
        onSubmit={(data) => this.handleVoxelEditorSubmit(data)}
      />
    );
  }

  renderEditor() {
    switch(this.state.activeTab) {
      case 'code': {
        return this.renderCodeEditor();
      }
      case 'design': {
        return this.renderDesignEditor();
      }
    }
    return null;
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

    const editor = this.renderEditor();

    return (
      <div style={rootStyle}>
        <Layout flow="row" style={styles.content}>
          <LayoutContainer size={this.initialGameWidth} onResize={size => this.handleGameWidthResize(size)}>
            <Layout flow="column" style={styles.fillParent}>
              <LayoutContainer size={this.initialGameHeight} onResize={size => this.handleGameHeightResize(size)}>
                <Game gameState={this.props.studioState.gameState}
                      onChange={(gameState => this.handleStateChange({ gameState }))}
                      sizeVersion={this.state.gameSizeVersion}
                      stateLayer={this.props.stateLayer}
                >
                  {this.props.game}
                </Game>
              </LayoutContainer>
              <LayoutContainer remaining={true}>
                <Toolbar style={{ backgroundColor: Colors.grey200 }}>
                  <ToolbarGroup key={0} float="right">
                    {controlButton}
                  </ToolbarGroup>
                </Toolbar>
              </LayoutContainer>
            </Layout>
          </LayoutContainer>

          <LayoutContainer remaining={true}>
            <div style={styles.fileCategoryButtonContainer}>
              <IconButton
                iconClassName="material-icons"
                tooltip="Code"
                onTouchTap={() => this.onTabChange('code')}
                style={styles.fileCategoryButton}
                tooltipStyles={{ opacity: 1 }}
              >
                code
              </IconButton>
              <IconButton
                iconClassName="material-icons"
                tooltip="Design"
                onTouchTap={() => this.onTabChange('design')}
                style={styles.fileCategoryButton}
                tooltipStyles={{ opacity: 1 }}
              >
                build
              </IconButton>
            </div>
            <div style={styles.editor}>
              {editor}
            </div>
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
  game?: React.ReactElement<any>;
  style?: React.CSSProperties;
}

interface StudioOwnState {
  mount?: boolean;
}

interface CreateStateOptions {
  codeEditorState?: CreateCodeEditorStateOptions;
  voxelEditorState?: CreateVoxelEditorStateOptions;
}

class Studio extends React.Component<StudioProps, StudioOwnState> {
  static creatState(options: CreateStateOptions = {}): StudioState {
    return {
      codeEditorState: CodeEditor.creatState(options.codeEditorState),
      gameState: Game.createState(),
      voxelEditorState: VoxelEditor.createState(options.voxelEditorState),
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
                  game={this.props.game || null}
      />
    );
  };
}

export default Studio;
