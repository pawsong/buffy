import * as React from 'react';

import FontIcon from 'material-ui/lib/font-icon';
import Colors from 'material-ui/lib/styles/colors';
import Avatar from 'material-ui/lib/avatar';

import { FileType } from './types';

export function getIconName(fileType: FileType) {
  switch(fileType) {
    case FileType.ALL: return 'list';
    case FileType.CODE: return 'code';
    case FileType.MODEL: return 'brush';
    case FileType.ROBOT: return 'event_note';
    case FileType.WORLD: return 'layers';
  }
  return '';
}

export function getFileTypeLabel(fileType: FileType) {
  switch(fileType) {
    case FileType.ALL: return 'All';
    case FileType.CODE: return 'Code';
    case FileType.MODEL: return 'Model';
    case FileType.ROBOT: return 'Recipe';
    case FileType.WORLD: return 'World';
  }
  return '';
}

interface FileTypeIconOptions {
  fontSize?: number;
}

export function getFileTypeIcon(fileType: FileType, style: React.CSSProperties = {}) {
  switch(fileType) {
    case FileType.CODE: {
      return (
        <FontIcon className="material-icons" style={style}>
          {getIconName(FileType.CODE)}
        </FontIcon>
      );
    }
    case FileType.MODEL: {
      return (
        <FontIcon className="material-icons" style={style}>
          {getIconName(FileType.MODEL)}
        </FontIcon>
      );
    }
    case FileType.ROBOT: {
      return (
        <FontIcon className="material-icons" style={style}>
          {getIconName(FileType.ROBOT)}
        </FontIcon>
      );
    }
    case FileType.WORLD: {
      return (
        <FontIcon className="material-icons" style={style}>
          {getIconName(FileType.WORLD)}
        </FontIcon>
      );
    }
  }

  return null;
}

interface FileTypeAvatarOptions {
  size?: number;
  fontSize?: number;
}

export function getFileTypeAvatar(fileType: FileType, options: FileTypeAvatarOptions = {}) {
  const size = options.size || 40;
  const fontSize = options.fontSize || 24;

  const fontStyle = {
    fontSize,
    margin: (size - fontSize) / 2,
  };

  switch(fileType) {
    case FileType.CODE: {
      return (
        <Avatar
          size={size}
          icon={getFileTypeIcon(fileType, fontStyle)}
          backgroundColor={Colors.green500}
        />
      );
    }
    case FileType.MODEL: {
      return (
        <Avatar
          size={size}
          icon={getFileTypeIcon(fileType, fontStyle)}
          backgroundColor={Colors.pinkA200}
        />
      );
    }
    case FileType.ROBOT: {
      return (
        <Avatar
          size={size}
          icon={getFileTypeIcon(fileType, fontStyle)}
          backgroundColor={Colors.blue500}
        />
      );
    }
    case FileType.WORLD: {
      return (
        <Avatar
          size={size}
          icon={getFileTypeIcon(fileType, fontStyle)}
          backgroundColor={Colors.amber500}
        />
      );
    }
  }

  return null;
}
