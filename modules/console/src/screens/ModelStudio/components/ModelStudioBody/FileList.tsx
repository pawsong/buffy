import * as React from 'react';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import FontIcon from 'material-ui/FontIcon';
import { grey400 } from 'material-ui/styles/colors';
// import Avatar from 'material-ui/Avatar';
import Avatar from './Avatar';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconButton from 'material-ui/IconButton';
// import IconMenu from 'material-ui/IconMenu';
const IconMenu = require('material-ui/IconMenu').default; // For disableAutoFocus

import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import * as classNames from 'classnames';

import { ModelFile, ModelFileMap } from '../../types';
import { getFileTypeLabel, getFileTypeAvatar } from '../../../../utils/file';

const styles = require('../../ModelStudio.css');
import { getForkItemLabel } from '../../utils';

interface FileListProps extends React.Props<FileList> {
  userId: string;
  files: ModelFileMap;
  renameFileId: string;
  onFileTouchTap: (fileId: string) => any;
  onRequestRename: (fileId: string) => any;
  onFileRename: (fileId: string, name: string) => any;
  onFileRemove: (fileId: string) => any;
  onFileDelete: (fileId: string) => any;
}

const markForModifiedClass = classNames('material-icons', styles.markForModified);

const iconButtonElement = (
  <IconButton
    touch={true}
    tooltip="more"
    tooltipPosition="bottom-left"
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

interface FileListState {
  renameValue?: string;
}

class FileList extends React.Component<FileListProps, FileListState> {
  constructor(props) {
    super(props);
    this.state = {
      renameValue: '',
    };
  }

  handleRequestFileRename = (fileId: string) => {
    const file = this.props.files.get(fileId);

    this.setState({ renameValue: file.name });
    setTimeout(() => {
      this.props.onRequestRename(fileId);
    }, 0);
  }

  handleRenameValueChange = (event: any) => {
    this.setState({ renameValue: event.target.value });
  }

  private submitNewName() {
    this.props.onFileRename(this.props.renameFileId, this.state.renameValue);
    this.setState({ renameValue: '' });
  }

  handleRenameTextBlur = (e) => {
    this.submitNewName();
  }

  handleRenameTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.keyCode === 13 /* ENTER */) {
      this.submitNewName();
    }
  }

  render() {
    const files = this.props.files.toArray()
      .sort((lhs, rhs) => lhs.name === rhs.name ? 0 : lhs.name > rhs.name ? 1 : -1)
      .map(file => {
        const rightIconMenu = (
          <IconMenu
            iconButtonElement={iconButtonElement}
            disableAutoFocus={true}
          >
            <MenuItem
              onTouchTap={() => this.handleRequestFileRename(file.id)}
            >
              Rename
            </MenuItem>
            <MenuItem
              onTouchTap={() => this.props.onFileRemove(file.id)}
            >
              Remove from list
            </MenuItem>
            {!file.created && file.owner && file.owner.id === this.props.userId ? <MenuItem
              onTouchTap={() => this.props.onFileDelete(file.id)}
            >
              Delete permanently
            </MenuItem> : null}
          </IconMenu>
        );

        const primaryText = this.props.renameFileId === file.id
          ? (
            <TextField
              id={file.id}
              style={{ height: 19 }}
              fullWidth={true}
              underlineShow={false}
              value={this.state.renameValue}
              onChange={this.handleRenameValueChange}
              onBlur={this.handleRenameTextBlur}
              onKeyDown={this.handleRenameTextKeyDown}
              ref={ref => ref && ref.focus()}
            />
          )
          : (
            <span>
              {file.created || file.modified ? <i className={markForModifiedClass}>fiber_manual_record</i> : null}
              {file.name || '(Untitled)'}
            </span>
          );

        let secondaryText: React.ReactElement<any>;
        if (file.forkParent) {
          secondaryText = (
            <p>forked from <b>{getForkItemLabel(file.forkParent)}</b></p>
          );
        } else {
          secondaryText = null;
        }

        return (
          <ListItem
            key={file.id}
            leftAvatar={<Avatar src={file.thumbnail} />}
            rightIconButton={rightIconMenu}
            primaryText={primaryText}
            secondaryText={secondaryText}
            onTouchTap={() => this.props.onFileTouchTap(file.id)}
          />
        );
      });

    return (
      <List>
        {files}
      </List>
    );
  }
}

export default FileList;
