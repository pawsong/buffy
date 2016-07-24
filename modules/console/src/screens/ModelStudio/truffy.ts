export const PORT = 6170; // TODO: Use range

export const HEADER_ERROR_REASON = 'x-truffy-error-reason';
export const HEADER_CLIPBOARD = 'x-truffy-clipboard';

export const REASON_TRUFFY_NOT_FOUND = 'truffy_not_found';
export const REASON_TROVE_NOT_FOUND = 'trove_not_found';
export const REASON_UNEXPECTED_ERROR = 'unexpected';

import { ModelFile } from './types';

export interface TruffyError {
  file: ModelFile;
  action: string;
  reason: string;
  message: string;
}

export const ACTION_INSTALL = 'install';
export const ACTION_DOWNLOAD = 'compile';
