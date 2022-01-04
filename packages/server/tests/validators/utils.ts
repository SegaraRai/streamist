import type {
  ClassConstructor,
  ClassTransformOptions,
} from 'class-transformer';
import { ValidatorOptions, validateOrReject } from 'class-validator';
import { fastPlainToInstance } from '$/services/fastClassTransformer';

const tOpts: ClassTransformOptions = {
  enableCircularCheck: true,
};

const vOpts: ValidatorOptions = {
  validationError: { target: false },
};

export const validate = <T extends object>(
  cls: ClassConstructor<T>,
  obj: T
): Promise<void> =>
  validateOrReject(fastPlainToInstance(cls, obj as any, tOpts), vOpts);
