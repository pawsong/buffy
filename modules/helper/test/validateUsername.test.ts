import validateUsername, {
  ValidationResult,
} from '../lib/validateUsername';

import { expect } from 'chai';

describe('validateUsername', () => {
  it('should fail with non-string argument', () => {
    const ret = validateUsername(123 as any);
    expect(ret).to.equal(ValidationResult.INVALID_TYPE);
  });

  it('should fail with too short argument', () => {
    const ret = validateUsername('');
    expect(ret).to.equal(ValidationResult.TOO_SHORT);
  });

  it('should fail with too long argument', () => {
    const ret = validateUsername('123456789012345678901');
    expect(ret).to.equal(ValidationResult.TOO_LONG);
  });

  it('should fail with argument with invalid characters', () => {
    expect(validateUsername(
      'a_'
    )).to.equal(ValidationResult.INVALID_CHARACTER);

    expect(validateUsername(
      'a@'
    )).to.equal(ValidationResult.INVALID_CHARACTER);

    expect(validateUsername(
      '-a'
    )).to.equal(ValidationResult.INVALID_CHARACTER);
  });

  it('should fail on reserved names', () => {
    expect(validateUsername(
      'admin'
    )).to.equal(ValidationResult.RESERVED);
  });

  it('should pass with correct argument', () => {
    const ret = validateUsername('12345678901234567890');
    expect(ret).to.equal(ValidationResult.OK);
  });
});
