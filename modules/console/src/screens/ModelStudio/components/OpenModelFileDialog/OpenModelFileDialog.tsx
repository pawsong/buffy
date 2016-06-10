import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Tabs from 'material-ui/Tabs/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { cyan500, grey400 } from 'material-ui/styles/colors';
// import * as Dropzone from 'react-dropzone';
const Dropzone = require('react-dropzone');
import { Ndarray } from 'ndarray';

import GridList from 'material-ui/GridList/GridList';
// import GridTile from 'material-ui/GridList/GridTile';
const GridTile = require('material-ui/GridList/GridTile').default;

import { saga, SagaProps, ImmutableTask, isRunning } from '../../../../saga';
import { User } from '../../../../reducers/users';

const styles = require('./OpenModelFileDialog.css');

import ModelEditor, { ModelFileState } from '../../../../components/ModelEditor';
import { openRemoteFile, loadRemoteFiles } from '../../sagas';

const Waypoint = require('react-waypoint');

interface ModelFileDocument {
  id: string;
  name: string;
  thumbnail: string;
  modifiedAt: string;
  isPublic: boolean;
}

const inlineStyles = {
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
}

const fileExtPatt = /\.(\w+)$/;

interface OpenModelFileDialogProps extends SagaProps {
  user: User;
  open: boolean;
  onFileOpen: (fileState: ModelFileState, created: boolean) => any;
  onRequestClose: () => any;
  onRequestSnackbar: (message: string) => any;
  loadRemoteFiles?: ImmutableTask<any>;
  openRemoteFile?: ImmutableTask<any>;
}

enum TabType {
  MY_FILE_REMOTE,
  MY_FILE_LOCAL,
  // PUBLIC_REPO,
}

interface OpenModelFileDialogState {
  tabType?: TabType;
  myFileSelectedId?: string;
  myFiles?: ModelFileDocument[];
  allMyFilesLoaded?: boolean;
}

@withStyles(styles)
@saga({
  loadRemoteFiles,
  openRemoteFile,
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
    };
  }

  handleTabChange = (tabType: TabType) => this.setState({ tabType });

  componentDidMount() {
    this.reader = new FileReader();
  }

  componentWillReceiveProps(nextProps: OpenModelFileDialogProps) {
    if (!this.props.open && nextProps.open) {
      this.setState({
        tabType: TabType.MY_FILE_REMOTE,
        myFileSelectedId: '',
        myFiles: [],
        allMyFilesLoaded: false,
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
        this.props.onFileOpen(result, true);
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
      case TabType.MY_FILE_LOCAL: {
        // Use dropzone instead of submit button click.
        return false;
      }
      // case TabType.PUBLIC_REPO: {
      //   return false;
      // }
    }
    return false;
  }

  isDisabled(): boolean {
    return isRunning(this.props.openRemoteFile);
  }

  handleOpen = () => {
    switch(this.state.tabType) {
      case TabType.MY_FILE_REMOTE: {
        this.props.runSaga(this.props.openRemoteFile, this.state.myFileSelectedId, (fileState: ModelFileState) => {
          this.props.onFileOpen(fileState, false);
        });
        return;
      }
    }
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

  renderMyRemoteBody(disabled: boolean) {
    const tiles = this.state.myFiles.map(file => {
      const onTouchTap = () => disabled || this.setState({ myFileSelectedId: file.id });

      let style: any = { cursor: 'pointer' };
      if (this.state.myFileSelectedId === file.id) {
        style.border = `6px solid ${disabled ? grey400 : cyan500}`;
      } else {
        style.margin = '6px';
      }

      return (
        <GridTile
          key={file.id}
          title={file.name}
          style={style}
          onTouchTap={onTouchTap}
        >
          <img src={`${__RESOURCE_BASE__}/${file.thumbnail}`} />
        </GridTile>
      )
    });

    return (
      <div>
        <GridList
          cellHeight={150}
          cols={4}
          style={{ margin: 10 }}
          padding={10}
        >
          {tiles}
        </GridList>
        {
          this.state.allMyFilesLoaded ? null : isRunning(this.props.loadRemoteFiles)
            ? (
              <div>Loading...</div>
            )
            : (
              <Waypoint
                onEnter={this.handleWaypointEnter}
                threshold={2.0}
              />
            )
        }
      </div>
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
      case TabType.MY_FILE_LOCAL: {
        return this.renderMyLocalBody();
      }
      // case TabType.PUBLIC_REPO: {
      //   return (
      //     <div>PUBLIC_REPO</div>
      //   );
      // }
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
              <Tab label="Local File" className={styles.tab} value={TabType.MY_FILE_LOCAL} disabled={disabled} />
              {/*<Tab label="search" className={styles.tab} value={TabType.PUBLIC_REPO} disabled={disabled} />*/}
            </Tabs>
          </div>
        }
        actions={actions}
        modal={disabled}
        open={this.props.open}
        onRequestClose={this.props.onRequestClose}
        autoScrollBodyContent={true}
      >
        {this.renderBody(disabled)}
      </Dialog>
    );
  }
}


export default OpenModelFileDialog;
