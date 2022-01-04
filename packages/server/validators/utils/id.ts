import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { isId } from '$shared/id';

// class-validatorはv0.13.2時点でカスタムデコレーターに対するeachオプションに対応していないため、
// それらについては@IsIdデコレーターではなく@ValidateデコレーターとIsIdConstraintを組み合わせて検証する
// https://github.com/typestack/class-validator/issues/237
@ValidatorConstraint({
  name: 'isIdConstraint',
  async: false,
})
export class IsIdConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isId(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid id`;
  }
}

export function IsId(validationOptions?: ValidationOptions): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'isId',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: IsIdConstraint,
    });
  } as PropertyDecorator;
}
