import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { isRegion } from '$shared/regions';

// class-validatorはv0.13.2時点でカスタムデコレーターに対するeachオプションに対応していないため、
// それらについては@IsRegionデコレーターではなく@ValidateデコレーターとIsRegionConstraintを組み合わせて検証する
// https://github.com/typestack/class-validator/issues/237
@ValidatorConstraint({
  name: 'isRegionConstraint',
  async: false,
})
export class IsRegionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isRegion(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid region`;
  }
}

export function IsRegion(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'isRegion',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: IsRegionConstraint,
    });
  } as PropertyDecorator;
}
