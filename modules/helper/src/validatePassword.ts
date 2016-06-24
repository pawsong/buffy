export enum ValidationResult {
  OK,
  EMPTY,
  TOO_SHORT,
  TOO_LONG,
  INVALID_TYPE,
};

export const MIN_LENGTH = 6;
export const MAX_LENGTH = 100;

export default function validatePassword(password: string): ValidationResult {
  if (!password) return ValidationResult.EMPTY;

  if (typeof password !== 'string') return ValidationResult.INVALID_TYPE;

  if (password.length < MIN_LENGTH) return ValidationResult.TOO_SHORT;
  if (password.length > MAX_LENGTH) return ValidationResult.TOO_LONG;

  return ValidationResult.OK;
}
