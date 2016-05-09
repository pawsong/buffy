import { FileType, SourceFile } from '../../components/Studio/types';

export interface NewFileSpec {
  id: string;
  type: FileType;
  data: any;
}
