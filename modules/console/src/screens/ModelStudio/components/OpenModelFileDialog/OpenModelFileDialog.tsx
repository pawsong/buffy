import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Tabs from 'material-ui/Tabs/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { cyan500, grey400 } from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import StarBorder from 'material-ui/svg-icons/toggle/star-border';
// import * as Dropzone from 'react-dropzone';
const Dropzone = require('react-dropzone');
import { Ndarray } from 'ndarray';

import SelectableGridList from './SelectableGridList';

import { saga, SagaProps, ImmutableTask, isRunning } from '../../../../saga';
import { User } from '../../../../reducers/users';

const styles = require('./OpenModelFileDialog.css');

import ModelEditor, { ModelFileState } from '../../../../components/ModelEditor';
import {
  openRemoteFile,
  loadRemoteFiles,
  loadLatestPublicFiles,
} from '../../sagas';

const Waypoint = require('react-waypoint');

import generateObjectId from '../../../../utils/generateObjectId';

import { ModelFileOpenParams, ModelFileDocument } from '../../types';

const inlineStyles = {
  dialogTitle: {
    marginBottom: 0,
    borderBottom: 'none',
  },
  dialogActionsContainer: {
    marginTop: 0,
    borderTop: 'none',
  },
  dropzone: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
    borderRadius: 5
  },
  dropzoneActive: {
    borderStyle: 'solid',
    backgroundColor: '#eee'
  },
  dropzoneReject: {
    borderStyle: 'solid',
    backgroundColor: '#ffdddd'
  },
  gridChildImg: {
    height: '100%',
    transform: 'translateX(-50%)',
    position: 'relative',
    left: '50%',
  },
  gridChildImgContent: {
    width: '100%',
    height: '100%',
  },
}

const fileExtPatt = /\.(\w+)$/;

interface OpenModelFileDialogProps extends SagaProps {
  user: User;
  open: boolean;
  onFileOpen: (params: ModelFileOpenParams) => any;
  onRequestClose: () => any;
  onRequestSnackbar: (message: string) => any;
  loadRemoteFiles?: ImmutableTask<any>;
  openRemoteFile?: ImmutableTask<any>;
  loadLatestPublicFiles?: ImmutableTask<any>;
}

enum TabType {
  MY_FILE_REMOTE,
  PUBLIC_REPO,
  MY_FILE_LOCAL,
}

interface OpenModelFileDialogState {
  tabType?: TabType;
  myFileSelectedId?: string;
  myFiles?: ModelFileDocument[];
  publicFiles?: ModelFileDocument[];
  allMyFilesLoaded?: boolean;
  allPublicFilesLoaded?: boolean;
  publicSelectedId?: string;
}

@withStyles(styles)
@saga({
  loadRemoteFiles,
  openRemoteFile,
  loadLatestPublicFiles,
})
class OpenModelFileDialog extends React.Component<OpenModelFileDialogProps, OpenModelFileDialogState> {
  private reader: FileReader;

  constructor(props) {
    super(props);
    this.state = {
      tabType: TabType.MY_FILE_REMOTE,
      myFileSelectedId: '',
      myFiles: [],
      allMyFilesLoaded: false,
      publicFiles: [],
      allPublicFilesLoaded: false,
      publicSelectedId: '',
    };
  }

  handleTabChange = (tabType: TabType) => this.setState({ tabType });

  componentDidMount() {
    this.reader = new FileReader();
  }

  componentWillReceiveProps(nextProps: OpenModelFileDialogProps) {
    if (!this.props.open && nextProps.open) {
      this.setState({
        tabType: this.props.user ? TabType.MY_FILE_REMOTE : TabType.PUBLIC_REPO,
        myFileSelectedId: '',
        myFiles: [],
        allMyFilesLoaded: false,
        publicSelectedId: '',
        publicFiles: [],
        allPublicFilesLoaded: false,
      });
    }
  }

  handleDrop = (files: File[]) => {
    const file = files[0];
    const result = fileExtPatt.exec(file.name);
    if (!result) {
      this.props.onRequestSnackbar('Invalid file name');
      return;
    }

    let importFn: (buffer: ArrayBuffer) => {
      result?: ModelFileState;
      error?: string;
    };

    const ext = result[1].toLowerCase();
    switch(ext) {
      case 'vox': {
        importFn = ModelEditor.importVoxFile;
        break;
      }
      default: {
        // TODO: Noti
        this.props.onRequestSnackbar(`Unsupported file extension: ${ext}`);
        return;
      }
    }

    this.reader.abort();
    this.reader.onload = () => {
      const arrayBuffer = this.reader.result;
      const { result, error } = importFn(arrayBuffer);
      if (error) {
        this.props.onRequestSnackbar(`Import failed: ${error}`);
      } else {
        this.props.onFileOpen({
          id: generateObjectId(),
          name: file.name,
          body: result,
          readonly: false,
          created: true,
        });
      }
    }
    this.reader.readAsArrayBuffer(file);
  }

  componentWillUnmount() {
    this.reader.abort();
  }

  handleMyFileSelect(fileId: string) {
    this.setState({ myFileSelectedId: fileId });
  }

  isSubmitReady(): boolean {
    switch(this.state.tabType) {
      case TabType.MY_FILE_REMOTE: {
        return !!this.state.myFileSelectedId;
      }
      case TabType.PUBLIC_REPO: {
        return !!this.state.publicSelectedId;
      }
      case TabType.MY_FILE_LOCAL: {
        // Use dropzone instead of submit button click.
        return false;
      }
    }
    return false;
  }

  isDisabled(): boolean {
    return isRunning(this.props.openRemoteFile);
  }

  handleOpen = () => {
    let fileId: string;
    switch(this.state.tabType) {
      case TabType.MY_FILE_REMOTE: {
        fileId = this.state.myFileSelectedId;
        break;
      }
      case TabType.PUBLIC_REPO: {
        fileId = this.state.publicSelectedId;
        break;
      }
      default: {
        return;
      }
    }

    this.props.runSaga(this.props.openRemoteFile,
      fileId,
      (doc: ModelFileDocument, fileState: ModelFileState) => {
        this.props.onFileOpen({
          id: doc.id,
          name: doc.name,
          created: false,
          readonly: false,
          body: fileState,
        });
      }
    );
  }

  loadMoreItems = (before: string) => {
    this.props.runSaga(this.props.loadRemoteFiles, this.props.user.username, {
      before,
    }, docs => {
      this.setState({
        myFiles: this.state.myFiles.concat(docs),
        allMyFilesLoaded: docs.length === 0,
      });
    });
  }

  handleWaypointEnter = () => {
    const lastFile = this.state.myFiles[this.state.myFiles.length - 1];
    this.loadMoreItems(lastFile && lastFile.modifiedAt);
  }

  handleMyRemoteSelect = (id: string) => this.setState({ myFileSelectedId: id });

  renderMyRemoteBody(disabled: boolean) {
    const items = this.state.myFiles.map(file => ({
      id: file.id,
      name: file.name,
      image: `${__CDN_BASE__}/${file.thumbnail}`,
    }));

    return (
      <SelectableGridList
        items={items}
        disabled={disabled}
        loadMore={this.handleWaypointEnter}
        loading={isRunning(this.props.loadRemoteFiles)}
        useLoad={!this.state.allMyFilesLoaded}
        selectedItem={this.state.myFileSelectedId}
        onSelect={this.handleMyRemoteSelect}
      />
    );
  }

  loadMorePublicFiles = (before: string) => {
    this.props.runSaga(this.props.loadLatestPublicFiles, {
      before,
    }, docs => {
      this.setState({
        publicFiles: this.state.publicFiles.concat(docs),
        allPublicFilesLoaded: docs.length === 0,
      });
    });
  }

  handlePublicFilesLoadMore = () => {
    const lastFile = this.state.publicFiles[this.state.publicFiles.length - 1];
    this.loadMorePublicFiles(lastFile && lastFile.modifiedAt);
  };

  handleSelectPublicFile = (id: string) => this.setState({ publicSelectedId: id });

  renderPublicRepoBody(disabled: boolean) {
    const items = this.state.publicFiles.map(file => ({
      id: file.id,
      name: file.name,
      image: `${__CDN_BASE__}/${file.thumbnail}`,
    }));

    return (
      <SelectableGridList
        items={items}
        disabled={disabled}
        loadMore={this.handlePublicFilesLoadMore}
        loading={isRunning(this.props.loadLatestPublicFiles)}
        useLoad={!this.state.allPublicFilesLoaded}
        selectedItem={this.state.publicSelectedId}
        onSelect={this.handleSelectPublicFile}
      />
    );
  }

  renderMyLocalBody() {
    return (
      <Dropzone
        style={inlineStyles.dropzone}
        activeStyle={inlineStyles.dropzoneActive}
        rejectStyle={inlineStyles.dropzoneReject}
        onDrop={this.handleDrop}
      >
        <div className={styles.dropzoneContent}>
          <div>Try dropping some files here, or click to select files to upload.</div>
        </div>
      </Dropzone>
    );
  }

  renderBody(disabled: boolean) {
    if (!this.props.open) return null;

    switch(this.state.tabType) {
      case TabType.MY_FILE_REMOTE: {
        return this.renderMyRemoteBody(disabled);
      }
      case TabType.PUBLIC_REPO: {
        return this.renderPublicRepoBody(disabled);
      }
      case TabType.MY_FILE_LOCAL: {
        return this.renderMyLocalBody();
      }
    }
    return null;
  }

  render() {
    const disabled = this.isDisabled();

    const actions = [
      <FlatButton
        label="Cancel"
        disabled={disabled}
        primary={true}
        onTouchTap={this.props.onRequestClose}
      />,
      <FlatButton
        label="Open"
        disabled={disabled || !this.isSubmitReady()}
        secondary={true}
        keyboardFocused={true}
        onTouchTap={this.handleOpen}
      />,
    ];

    return (
      <Dialog
        title={
          <div>
            <div>Open file</div>
            <Tabs
              tabItemContainerStyle={{ backgroundColor: 'white', marginTop: 16 }}
              value={this.state.tabType}
              onChange={(v) => this.handleTabChange(v)}
            >
              {this.props.user ? (
                <Tab label="Remote File" className={styles.tab} value={TabType.MY_FILE_REMOTE} disabled={disabled} />
              ): null}
              <Tab label="search" className={styles.tab} value={TabType.PUBLIC_REPO} disabled={disabled}>
                <div className={styles.tabHeader}>Sort: Latest</div>
              </Tab>
              <Tab label="Local File" className={styles.tab} value={TabType.MY_FILE_LOCAL} disabled={disabled} />
            </Tabs>
          </div>
        }
        titleStyle={inlineStyles.dialogTitle}
        actions={actions}
        actionsContainerStyle={inlineStyles.dialogActionsContainer}
        modal={disabled}
        open={this.props.open}
        onRequestClose={this.props.onRequestClose}
        autoScrollBodyContent={this.state.tabType !== TabType.MY_FILE_LOCAL}
      >
        {this.renderBody(disabled)}
      </Dialog>
    );
  }
}


export default OpenModelFileDialog;
