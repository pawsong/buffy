import * as React from 'react';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import FontIcon from 'material-ui/lib/font-icon';
import Colors from 'material-ui/lib/styles/colors';
import Avatar from 'material-ui/lib/avatar';
import * as classNames from 'classnames';

import { FileDescriptor, FileType, SourceFile } from '../../types';
import { getIconName, getFileTypeLabel, getFileTypeAvatar } from '../../utils';

const styles = require('./FileBrowser.css');

interface FileListProps extends React.Props<FileList> {
  files: SourceFile[];
  filter: FileType;
  onFileTouchTap: (fileId: string) => any;
}

const markForModifiedClass = classNames('material-icons', styles.markForModified);

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
          primaryText={
            <span>
              {file.modified ? <i className={markForModifiedClass}>fiber_manual_record</i> : null}
              {file.name || '(Untitled)'}
            </span>
          }
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
