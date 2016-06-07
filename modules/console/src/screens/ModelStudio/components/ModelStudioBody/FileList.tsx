import * as React from 'react';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import FontIcon from 'material-ui/FontIcon';
import * as Colors from 'material-ui/styles/colors';
import Avatar from 'material-ui/Avatar';
import * as classNames from 'classnames';

import { ModelFile, ModelFileMap } from '../../types';
import { getFileTypeLabel, getFileTypeAvatar } from '../../../../utils/file';

const styles = require('../../ModelStudio.css');

interface FileListProps extends React.Props<FileList> {
  files: ModelFileMap;
  onFileTouchTap: (fileId: string) => any;
}

const markForModifiedClass = classNames('material-icons', styles.markForModified);

class FileList extends React.Component<FileListProps, {}> {
  render() {
    const files = this.props.files.toArray()
      .sort((lhs, rhs) => lhs.name === rhs.name ? 0 : lhs.name > rhs.name ? 1 : -1)
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
