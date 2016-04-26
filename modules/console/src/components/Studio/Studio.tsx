import './patch';

import * as React from 'react';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import RaisedButton from 'material-ui/lib/raised-button';
import { Tabs, Tab } from '../Tabs';
import IconButton from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';

import Avatar from 'material-ui/lib/avatar';
import ActionAssignment from 'material-ui/lib/svg-icons/action/assignment';
import EditorInsertChart from 'material-ui/lib/svg-icons/editor/insert-chart';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import ActionInfo from 'material-ui/lib/svg-icons/action/info';

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

const Radium = require('radium');

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
    top: 33,
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

interface FileDescriptor {
  id: string;
  name: string;
  type: string;
}

enum InstanceTabs {
  ROBOT,
  ZONE,
};

interface StudioBodyState {
  gameSizeVersion?: number;
  editorSizeVersions?: {
    code: number;
    design: number;
  }
  activeTab?: string;

  files?: { [index: string]: FileDescriptor },
  activeFileId?: string;

  fileBrowserOpen?: boolean;
  fileBrowserTypeFilter?: string;
  activeInstanceTab?: InstanceTabs,
}

interface FileTabsProps extends React.Props<FileTabs> {
  files: FileDescriptor[];
  activeFileId: string;
  onFileClick(fileId: string): any;
  onFileClose(fileId: string): any;
}

class FileTabs extends React.Component<FileTabsProps, {}> {
  render() {
    const tabs = this.props.files.map((file, index) => {
      const style = index === 0 ? {
        borderLeft: 'none',
      } : undefined;

      return (
        <Tab
          key={file.id}
          value={file.id}
          style={style}
          label={file.name}
        />
      );
    });

    return (
      <Tabs
        activeValue={this.props.activeFileId}
        onTabClick={value => this.props.onFileClick(value)}
      >
        {tabs}
      </Tabs>
    );
  }
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
  initialBrowserWidth: number;

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
      files: {
        '1': {
          id: '1',
          name: 'Code 1',
          type: 'code',
        },
        '2': {
          id: '2',
          name: 'Design 1',
          type: 'design'
        },
        '3': {
          id: '3',
          name: 'Robot 1',
          type: 'robot',
        },
        '4': {
          id: '4',
          name: 'Code 2',
          type: 'code',
        },
      },
      activeFileId: '1',
      fileBrowserOpen: false,
      fileBrowserTypeFilter: '',
      activeInstanceTab: InstanceTabs.ROBOT,
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

    this.initialBrowserWidth = parseInt(localStorage.getItem(StorageKeys.MASTER_BROWSER_WIDTH) || 150, 10);
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
        readyToRender={true}
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

  renderRobotEditor() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{  }}>
          <h1>Robot editor</h1>

          <h2>Codes for this robot</h2>
          <div>Code list</div>
          <div>Add button (Open browser)</div>

          <h2>Design for this robot</h2>
          <div>Preview</div>
          <div>Select button (Open browser)</div>
        </div>
      </div>
    );
  }

  renderEditor() {
    const files = Object.keys(this.state.files).map(fileId => this.state.files[fileId]);

    const fileTabs = (
      <FileTabs
        files={files}
        activeFileId={this.state.activeFileId}
        onFileClick={fileId => this.setState({ activeFileId: fileId })}
        onFileClose={() => {}}
      />
    );

    let editor = null;
    switch(this.state.files[this.state.activeFileId].type) {
      case 'code': {
        editor = this.renderCodeEditor();
        break;
      }
      case 'design': {
        editor = this.renderDesignEditor();
        break;
      }
      case 'robot': {
        editor = this.renderRobotEditor();
        break;
      }
    }

    return (
      <div>
        <FileTabs
          files={files}
          activeFileId={this.state.activeFileId}
          onFileClick={fileId => this.setState({ activeFileId: fileId })}
          onFileClose={() => {}}
        />
        <div style={styles.addon}>{editor}</div>
      </div>
    );
  }

  toggleFileBrowser(fileType: string) {
    const activeEditorType = this.state.files[this.state.activeFileId].type;

    if (this.state.fileBrowserTypeFilter === fileType) {
      this.setState({
        fileBrowserOpen: !this.state.fileBrowserOpen,
      }, () => this.setState(update(this.state, {
        editorSizeVersions: {
          [activeEditorType]: { $set: this.state.editorSizeVersions[activeEditorType] + 1 },
        },
      })));
    } else {
      this.setState({
        fileBrowserOpen: true,
        fileBrowserTypeFilter: fileType,
      }, () => this.setState(update(this.state, {
        editorSizeVersions: {
          [activeEditorType]: { $set: this.state.editorSizeVersions[activeEditorType] + 1 },
        },
      })));
    }
  }

  renderFileBrowser() {
    if (!this.state.fileBrowserOpen) return null;

    const files = Object.keys(this.state.files)
      .map(fileId => this.state.files[fileId])
      .filter(file => file.type === this.state.fileBrowserTypeFilter)
      .map(file => (
        <ListItem
          key={file.id}
          leftAvatar={<Avatar icon={<ActionAssignment />} backgroundColor={Colors.blue500} />}
          primaryText={file.name}
          secondaryText={file.type}
          onTouchTap={() => this.setState({ activeFileId: file.id })}
        />
      ));

    return (
      <List>
        {files}
      </List>
    );
  }

  renderInstanceBrowser() {
    const tabs = (
      <Tabs
        activeValue={this.state.activeInstanceTab}
        onTabClick={value => this.setState({ activeInstanceTab: value })}
      >
        <Tab
          value={InstanceTabs.ROBOT}
          label={'Robot'}
        />
        <Tab
          value={InstanceTabs.ZONE}
          label={'Zone'}
        />
      </Tabs>
    );

    let body = null;
    switch(this.state.activeInstanceTab) {
      case InstanceTabs.ROBOT: {
        body = (
          <List>
            <ListItem
              leftAvatar={<Avatar icon={<ActionAssignment />} backgroundColor={Colors.blue500} />}
              rightIcon={<ActionInfo />}
              primaryText="Vacation itinerary"
              secondaryText="Jan 20, 2014"
            />
          </List>
        );
        break;
      }
      case InstanceTabs.ZONE: {
        body = (
          <List>
            <ListItem
              leftAvatar={<Avatar icon={<EditorInsertChart />} backgroundColor={Colors.yellow600} />}
              rightIcon={<ActionInfo />}
              primaryText="Kitchen remodel"
              secondaryText="Jan 10, 2014"
            />
          </List>
        );
        break;
      }
    }

    return (
      <div>
        {tabs}
        {body}
      </div>
    );
  }

  handleFileBrowserWidthResize(size) {
    const activeEditorType = this.state.files[this.state.activeFileId].type;
    localStorage.setItem(StorageKeys.MASTER_BROWSER_WIDTH, `${size}`);

    // Resize editor
    this.setState(update(this.state, {
      editorSizeVersions: {
        [activeEditorType]: { $set: this.state.editorSizeVersions[activeEditorType] + 1 },
      },
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

    const editor = this.renderEditor();

    const fileBrowser = this.renderFileBrowser();

    const instanceBrowser = this.renderInstanceBrowser();

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
                { /* Object instance browser */}
                {instanceBrowser}
              </LayoutContainer>
            </Layout>
          </LayoutContainer>

          <LayoutContainer remaining={true}>
            <div style={styles.fileCategoryButtonContainer}>
              <IconButton
                iconClassName="material-icons"
                tooltip="Code"
                onTouchTap={() => this.toggleFileBrowser('code')}
                style={styles.fileCategoryButton}
                tooltipStyles={{ opacity: 1 }}
              >
                code
              </IconButton>
              <IconButton
                iconClassName="material-icons"
                tooltip="Design"
                onTouchTap={() => this.toggleFileBrowser('design')}
                style={styles.fileCategoryButton}
                tooltipStyles={{ opacity: 1 }}
              >
                build
              </IconButton>
              <IconButton
                iconClassName="material-icons"
                tooltip="Robot"
                onTouchTap={() => this.toggleFileBrowser('robot')}
                style={styles.fileCategoryButton}
                tooltipStyles={{ opacity: 1 }}
              >
                android
              </IconButton>
            </div>

            <Layout flow="row" style={styles.editor}>
              <LayoutContainer
                hide={!this.state.fileBrowserOpen}
                size={this.initialBrowserWidth}
                onResize={size => this.handleFileBrowserWidthResize(size)}
              >
                {fileBrowser}
              </LayoutContainer>
              <LayoutContainer remaining={true}>
                <div style={styles.fillParent}>
                  {editor}
                </div>
              </LayoutContainer>
            </Layout>
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
