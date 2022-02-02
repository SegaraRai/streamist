import {
  TransformationType,
  TypeMetadata,
  plainToInstance,
} from 'class-transformer';
import { plainToInstance as esm2015PlainToInstance } from 'class-transformer/esm2015';
import { TransformOperationExecutor as esm2015TransformOperationExecutor } from 'class-transformer/esm2015/TransformOperationExecutor';
import { defaultOptions } from 'class-transformer/esm2015/constants/default-options.constant';

const TransformOperationExecutor =
  plainToInstance === esm2015PlainToInstance
    ? esm2015TransformOperationExecutor
    : null;
if (!TransformOperationExecutor) {
  throw new Error('Unsupported class-transformer variant');
}

/**
 * a transformer which keeps class instances as is
 */
class FastTransformOperationExecutor extends TransformOperationExecutor {
  override transform(
    source: any,
    value: any,
    targetType: Function | TypeMetadata,
    arrayType: Function,
    isMap: boolean,
    level?: number
  ): any {
    if (value == null) {
      return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const constructorName = Object.getPrototypeOf(value)?.constructor?.name;
      if (constructorName != null && constructorName !== 'Object') {
        // an instance
        return value;
      }
    } else if (typeof value === 'function') {
      // a function
      return value;
    }
    // plain value or object
    return super.transform.call(
      this,
      source,
      value,
      targetType,
      arrayType,
      isMap,
      level
    );
  }
}

export const fastPlainToInstance: typeof plainToInstance = (
  cls,
  plain,
  options
): any => {
  const executor = new FastTransformOperationExecutor(
    TransformationType.PLAIN_TO_CLASS,
    {
      ...defaultOptions,
      ...options,
    }
  );
  const result = executor.transform(
    undefined,
    plain,
    cls,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    undefined!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    undefined!,
    undefined
  );
  return result;
};
