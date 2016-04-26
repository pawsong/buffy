import { FileType } from './types';

export function getIconName(fileType: FileType) {
  switch(fileType) {
    case FileType.ALL: return 'list';
    case FileType.CODE: return 'code';
    case FileType.DESIGN: return 'build';
    case FileType.ROBOT: return 'adb';
  }
  return '';
}

export function getFileTypeLabel(fileType: FileType) {
  switch(fileType) {
    case FileType.ALL: return 'All';
    case FileType.CODE: return 'Code';
    case FileType.DESIGN: return 'Design';
    case FileType.ROBOT: return 'Robot';
  }
  return '';
}
