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
import { openRemoteFile } from '../../sagas';

const { connect, PromiseState } = require('react-refetch');

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
  fetchMyFileList?: any;
  myFilesFetch?: any;
  openRemoteFile?: ImmutableTask<any>;
}

enum TabType {
  MY_FILE_REMOTE,
  MY_FILE_LOCAL,
  // PUBLIC_REPO,
}

interface OpenModelFileDialogState {
  tabType?: TabType;
  myFilePage?: number;
  myFileSelectedId?: string;
}

@withStyles(styles)
@connect((props: OpenModelFileDialogProps) => ({
  fetchMyFileList: (page: number) => ({
    myFilesFetch: {
      url: `${CONFIG_API_SERVER_URL}/files/@${props.user.username}?page=${page}`,
      force: true,
    },
  })
}))
@saga({
  openRemoteFile,
})
class OpenModelFileDialog extends React.Component<OpenModelFileDialogProps, OpenModelFileDialogState> {
  private reader: FileReader;

  constructor(props) {
    super(props);
    this.state = {
      tabType: TabType.MY_FILE_REMOTE,
      myFilePage: 1,
      myFileSelectedId: '',
    };
  }

  handleTabChange = (tabType: TabType) => this.setState({
    tabType,
    myFileSelectedId: '',
  });

  componentDidMount() {
    this.reader = new FileReader();
  }

  componentWillReceiveProps(nextProps: OpenModelFileDialogProps) {
    if (!this.props.open && nextProps.open) {
      this.setState({
        tabType: TabType.MY_FILE_REMOTE,
        myFilePage: 1,
        myFileSelectedId: '',
      });
    }
  }

  componentDidUpdate(prevProps: OpenModelFileDialogProps, prevState: OpenModelFileDialogState) {
    if (!this.props.open) return;

    if (this.state.tabType === TabType.MY_FILE_REMOTE) {
      if (
           this.props.open !== prevProps.open
        || this.state.tabType !== prevState.tabType
        || this.state.myFilePage !== prevState.myFilePage
      ) {
        this.props.fetchMyFileList(this.state.myFilePage);
      }
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

  renderMyRemoteBody(disabled: boolean) {
    if (!this.props.myFilesFetch || this.props.myFilesFetch.pending) {
      return (
        <div>Loading</div>
      );
    } else if (this.props.myFilesFetch.rejected) {
      return (
        <div>Someting wrong :(</div>
      );
    } else {
      const { files, count } = this.props.myFilesFetch.value;

      const tiles = files.map(file => {
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
        <GridList
          cellHeight={150}
          cols={4}
          style={{ margin: 10 }}
          padding={10}
        >
          {tiles}
        </GridList>
      );
    }
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
