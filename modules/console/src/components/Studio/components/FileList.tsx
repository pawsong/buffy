import * as React from 'react';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import FontIcon from 'material-ui/lib/font-icon';
import Colors from 'material-ui/lib/styles/colors';
import Avatar from 'material-ui/lib/avatar';

import { FileDescriptor, FileType } from '../types';
import { getIconName, getFileTypeLabel } from '../utils';

const fileTypeAvatars = {
  [FileType.CODE]: (
    <Avatar
      icon={<FontIcon className="material-icons">{getIconName(FileType.CODE)}</FontIcon>}
      backgroundColor={Colors.green500}
    />
  ),
  [FileType.DESIGN]: (
    <Avatar
      icon={<FontIcon className="material-icons">{getIconName(FileType.DESIGN)}</FontIcon>}
      backgroundColor={Colors.yellow500}
    />
  ),
  [FileType.ROBOT]: (
    <Avatar
      icon={<FontIcon className="material-icons">{getIconName(FileType.ROBOT)}</FontIcon>}
      backgroundColor={Colors.blue500}
    />
  ),
};

function getFileTypeAvatar(fileType: FileType) {
  return fileTypeAvatars[fileType] || null;
}

interface FileListProps extends React.Props<FileList> {
  files: FileDescriptor[];
  filter: FileType;
  onFileTouchTap: (fileId: string) => any;
}

class FileList extends React.Component<FileListProps, {}> {
  render() {
    const files = this.props.files
      .filter(file => this.props.filter === FileType.ALL || file.type === this.props.filter)
      .sort((lhs, rhs) => {
        if (lhs.type !== rhs.type) return lhs.type > rhs.type ? 1 : -1;
        if (lhs.name !== rhs.name) return lhs.name > rhs.name ? 1 : -1;
        return 0;
      })
      .map(file => (
        <ListItem
          key={file.id}
          leftAvatar={getFileTypeAvatar(file.type)}
          primaryText={file.name}
          secondaryText={getFileTypeLabel(file.type)}
          onTouchTap={() => this.props.onFileTouchTap(file.id)}
        />
      ));

    return (
      <List>
        {files}
      </List>
    );
  }
}

export default FileList;
