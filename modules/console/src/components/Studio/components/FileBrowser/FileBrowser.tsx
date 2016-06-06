import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import FlatButton from 'material-ui/FlatButton';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import * as Colors from 'material-ui/styles/colors';
const update = require('react-addons-update');

import FileList from './FileList';

import Layout, { LayoutContainer } from '../../../Layout';
import { FileType, FileDescriptor, SourceFile } from '../../types';
import { getIconName, getFileTypeLabel } from '../../utils';

const styles = require('./FileBrowser.css');

interface FileBrowserProps extends React.Props<FileBrowser> {
  initialWidth: number;
  onWidthResize: (size: number) => any;
  files: { [index: string]: SourceFile };
  resizeEditor: () => any;
  onOpenFileRequest: (fileType: FileType) => any;
  onFileClick: (fileId: string) => any;
}

interface FileBrowserState {
  fileBrowserTypeFilter?: FileType;
  fileBrowserOpen?: boolean;
}

@withStyles(styles)
class FileBrowser extends React.Component<FileBrowserProps, FileBrowserState> {
  constructor(props) {
    super(props);
    this.state = {
      fileBrowserTypeFilter: FileType.ALL,
      fileBrowserOpen: false,
    };
  }

  toggleFileBrowser(fileType: FileType) {
    if (this.state.fileBrowserTypeFilter === fileType) {
      this.setState({
        fileBrowserOpen: !this.state.fileBrowserOpen,
      }, () => this.props.resizeEditor());
    } else {
      this.setState({
        fileBrowserOpen: true,
        fileBrowserTypeFilter: fileType,
      }, () => !this.state.fileBrowserOpen && this.props.resizeEditor());
    }
  }

  renderFileBrowserButtons() {
    const types = [
      FileType.WORLD,
      FileType.ROBOT,
      FileType.MODEL,
      FileType.CODE,
      FileType.ALL,
    ];

    const buttons = types.map(type => {
      const active = this.state.fileBrowserOpen && this.state.fileBrowserTypeFilter === type;

      return (
        <IconButton
          key={type}
          iconClassName="material-icons"
          iconStyle={{ color: active ? Colors.black : Colors.grey500 }}
          tooltip={getFileTypeLabel(type)}
          onTouchTap={() => this.toggleFileBrowser(type)}
          className={styles.fileCategoryButton}
        >
          {getIconName(type)}
        </IconButton>
      );
    })

    return (
      <div className={styles.fileCategoryButtonContainer}>
        <div className={styles.fileCategoryButtons}>
          {buttons}
        </div>
      </div>
    );
  }

  renderFileBrowser() {
    if (!this.state.fileBrowserOpen) return null;

    const files = Object.keys(this.props.files).map(fileId => this.props.files[fileId]);

    const buttons = this.state.fileBrowserTypeFilter === FileType.MODEL ? (
      <div style={{ marginTop: 8 }}>
        <FlatButton
          label="Open file"
          style={{ width: '100%' }}
          onTouchTap={() => this.props.onOpenFileRequest(FileType.MODEL)}
        />
      </div>
    ) : null;

    return (
      <div>
        {buttons}
        <FileList
          files={files}
          filter={this.state.fileBrowserTypeFilter}
          onFileTouchTap={this.props.onFileClick}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderFileBrowserButtons()}
        <Layout flow="row" className={styles.editor}>
          <LayoutContainer
            hide={!this.state.fileBrowserOpen}
            size={this.props.initialWidth}
            onResize={size => this.props.onWidthResize(size)}
          >
            {this.renderFileBrowser()}
          </LayoutContainer>
          <LayoutContainer remaining={true}>
            <div className={styles.fillParent}>
              {this.props.children}
            </div>
          </LayoutContainer>
        </Layout>
      </div>
    );
  }
}

export default FileBrowser;
