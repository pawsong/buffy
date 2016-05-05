import * as React from 'react';
import { Tabs, Tab } from '../../Tabs';
import { FileDescriptor } from '../types';

interface FileTabsProps extends React.Props<FileTabs> {
  files: FileDescriptor[];
  activeFileId: string;
  onFileClick(fileId: string): any;
  onFileClose(fileId: string): any;
  onTabOrderChange(dragIndex: number, hoverIndex: number): any;
}

class FileTabs extends React.Component<FileTabsProps, {}> {
  render() {
    const tabs = this.props.files.map((file, index) => {
      const style = index === 0 ? {
        borderLeft: 'none',
      } : undefined;

      return (
        <Tab
          key={file.id}
          value={file.id}
          style={style}
          label={file.name}
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
