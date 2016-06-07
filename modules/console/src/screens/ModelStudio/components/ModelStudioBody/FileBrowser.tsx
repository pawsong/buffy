import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import FlatButton from 'material-ui/FlatButton';
import * as Colors from 'material-ui/styles/colors';
import * as update from 'react-addons-update';

import Layout, { LayoutContainer } from '../../../../components/Layout';
import FileMultiple from '../../../../components/icons/FileMultiple';
import { getFileTypeLabel, getFileTypeAvatar } from '../../../../utils/file';

import { ModelFile, ModelFileMap } from '../../types';

const styles = require('../../ModelStudio.css');

import FileList from './FileList';

interface FileBrowserProps extends React.Props<FileBrowser> {
  initialWidth: number;
  onWidthResize: (size: number) => any;
  files: ModelFileMap;
  onToggle: () => any;
  onFileClick: (fileId: string) => any;
}

interface FileBrowserState {
  fileBrowserOpen?: boolean;
}

class FileBrowser extends React.Component<FileBrowserProps, FileBrowserState> {
  constructor(props) {
    super(props);
    this.state = {
      fileBrowserOpen: false,
    };
  }

  toggleFileBrowser = () => {
    this.setState({
      fileBrowserOpen: !this.state.fileBrowserOpen,
    }, this.props.onToggle);
  }

  renderFileBrowserButtons() {
    const active = this.state.fileBrowserOpen;

    return (
      <div className={styles.fileCategoryButtonContainer}>
        <div className={styles.fileCategoryButtons}>
          <IconButton
            tooltip={'files'}
            onTouchTap={this.toggleFileBrowser}
            className={styles.fileCategoryButton}
          >
            <FileMultiple
              color={active ? Colors.black : Colors.grey500}
            />
          </IconButton>
        </div>
      </div>
    );
  }

  renderFileBrowser() {
    if (!this.state.fileBrowserOpen) return null;

    return (
      <div>
        <FileList
          files={this.props.files}
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
            onResize={this.props.onWidthResize}
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
