import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Tabs from 'material-ui/Tabs/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
// import * as Dropzone from 'react-dropzone';
const Dropzone = require('react-dropzone');
import { Ndarray } from 'ndarray';

const styles = require('./OpenModelFileDialog.css');

import ModelEditor, { ModelFileState } from '../../../../components/ModelEditor';

interface OpenModelFileDialogProps {
  open: boolean;
  onFileOpen: (fileState: ModelFileState, created: boolean) => any;
  onRequestClose: () => any;
  onRequestSnackbar: (message: string) => any;
}

enum TabType {
  LOCAL,
  MY_DRIVE,
  PUBLIC_REPO,
}

interface OpenModelFileDialogState {
  tabType: TabType;
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

@withStyles(styles)
class OpenModelFileDialog extends React.Component<OpenModelFileDialogProps, OpenModelFileDialogState> {
  private reader: FileReader;

  constructor(props) {
    super(props);
    this.state = {
      tabType: TabType.LOCAL,
    };
  }

  handleTabChange = (tabType: TabType) => this.setState({ tabType });

  componentDidMount() {
    this.reader = new FileReader();
  }

  componentWillReceiveProps(nextProps: OpenModelFileDialogProps) {
    if (!this.props.open && nextProps.open) {
      this.setState({
        tabType: TabType.LOCAL,
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

  renderBody() {
    switch(this.state.tabType) {
      case TabType.LOCAL: {
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
      case TabType.MY_DRIVE: {
        return (
          <div>MY_DRIVE</div>
        );
      }
      case TabType.PUBLIC_REPO: {
        return (
          <div>PUBLIC_REPO</div>
        );
      }
    }
    return null;
  }

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onTouchTap={this.props.onRequestClose}
      />,
      <FlatButton
        label="Submit"
        secondary={true}
        keyboardFocused={true}
        onTouchTap={this.props.onRequestClose}
      />,
    ];

    return (
      <Dialog
        title={
          <div>
            <div>Open Design File</div>
            <Tabs
              tabItemContainerStyle={{ backgroundColor: 'white', marginTop: 16 }}
              value={this.state.tabType}
              onChange={(v) => this.handleTabChange(v)}
            >
              <Tab label="Local File" className={styles.tab} value={TabType.LOCAL} />
              <Tab label="my design files" className={styles.tab} value={TabType.MY_DRIVE} />
              <Tab label="search" className={styles.tab} value={TabType.PUBLIC_REPO} />
            </Tabs>
          </div>
        }
        actions={actions}
        modal={false}
        open={this.props.open}
        onRequestClose={this.props.onRequestClose}
      >
        {this.renderBody()}
      </Dialog>
    );
  }
}


export default OpenModelFileDialog;
