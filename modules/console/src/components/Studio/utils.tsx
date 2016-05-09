import * as React from 'react';

import FontIcon from 'material-ui/lib/font-icon';
import Colors from 'material-ui/lib/styles/colors';
import Avatar from 'material-ui/lib/avatar';

import { FileType } from './types';

export function getIconName(fileType: FileType) {
  switch(fileType) {
    case FileType.ALL: return 'list';
    case FileType.CODE: return 'code';
    case FileType.DESIGN: return 'brush';
    case FileType.ROBOT: return 'event_note';
    case FileType.ZONE: return 'layers';
  }
  return '';
}

export function getFileTypeLabel(fileType: FileType) {
  switch(fileType) {
    case FileType.ALL: return 'All';
    case FileType.CODE: return 'Code';
    case FileType.DESIGN: return 'Design';
    case FileType.ROBOT: return 'Recipe';
    case FileType.ZONE: return 'Zone';
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
    case FileType.DESIGN: {
      return (
        <FontIcon className="material-icons" style={style}>
          {getIconName(FileType.DESIGN)}
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
    case FileType.DESIGN: {
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
  }

  return null;
}
