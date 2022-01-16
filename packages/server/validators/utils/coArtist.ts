import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { isValidCoArtistRole } from '$shared/coArtist';

// class-validatorはv0.13.2時点でカスタムデコレーターに対するeachオプションに対応していないため、
// それらについては@IsIdデコレーターではなく@ValidateデコレーターとIsIdConstraintを組み合わせて検証する
// https://github.com/typestack/class-validator/issues/237
@ValidatorConstraint({
  name: 'isCoArtistRoleConstraint',
  async: false,
})
export class IsCoArtistRoleConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isValidCoArtistRole(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid coArtist role`;
  }
}

export function IsCoArtistRole(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'isCoArtistRole',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: IsCoArtistRoleConstraint,
    });
  } as PropertyDecorator;
}
