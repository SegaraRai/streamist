import { ValidateIf, ValidationOptions } from 'class-validator';

export function IsNullable(
  this: unknown,
  options?: ValidationOptions
): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ValidateIf.call(
    this,
    (_object, value): boolean => value !== null,
    options
  );
}

export function IsUndefinable(
  this: unknown,
  options?: ValidationOptions
): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ValidateIf.call(
    this,
    (_object, value): boolean => value !== undefined,
    options
  );
}
