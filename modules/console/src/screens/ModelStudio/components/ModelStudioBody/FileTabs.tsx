import * as React from 'react';
import { Tabs, Tab } from '../../../../components/Tabs';
import { ModelFile } from '../../types';
import { getFileTypeIcon } from '../../../../utils/file';

interface FileTabsProps extends React.Props<FileTabs> {
  files: ModelFile[];
  activeFileId: string;
  onFileClick(fileId: string): any;
  onFileClose(fileId: string): any;
  onTabOrderChange(dragIndex: number, hoverIndex: number): any;
}

const styles = {
  fontIcon: {
    fontSize: 14,
    color: 'inherit',
    marginRight: 4,
  },
  labelContainer: {
    display: 'flex',
    alignItems: 'center',
  },
};

class FileTabs extends React.Component<FileTabsProps, {}> {
  render() {
    const tabs = this.props.files.map((file, index) => {
      return (
        <Tab
          key={file.id}
          value={file.id}
          modified={file.created || file.modified}
          label={
            <span style={styles.labelContainer}>
              {getFileTypeIcon(file.type, styles.fontIcon)}
              {file.name || '(Untitled)'}
            </span>
          }
        />
      );
    });

    return (
      <Tabs
        activeValue={this.props.activeFileId}
        onTabClick={value => this.props.onFileClick(value)}
        onTabOrderChange={this.props.onTabOrderChange}
        closable={true}
        onTabClose={value => this.props.onFileClose(value)}
      >
        {tabs}
      </Tabs>
    );
  }
}

export default FileTabs;
