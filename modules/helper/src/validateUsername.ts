const reserved = require('reserved-usernames');

const pattern = /^[a-z0-9][a-z0-9\-]*$/;

export enum ValidationResult {
  OK,
  TOO_SHORT,
  TOO_LONG,
  INVALID_CHARACTER,
  INVALID_TYPE,
  RESERVED,
};

export const MIN_LENGTH = 1;
export const MAX_LENGTH = 20;

export default function validateUsername(username: string): ValidationResult {
  if (typeof username !== 'string') return ValidationResult.INVALID_TYPE;

  if (username.length < MIN_LENGTH) return ValidationResult.TOO_SHORT;
  if (username.length > MAX_LENGTH) return ValidationResult.TOO_LONG;

  if (pattern.test(username) === false) return ValidationResult.INVALID_CHARACTER;

  if (reserved.indexOf(username) !== -1) return ValidationResult.RESERVED;

  return ValidationResult.OK;
}
