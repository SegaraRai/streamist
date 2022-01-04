import { describe, expect, it } from 'vitest';
import {
  VSourceCreateBodyWrapper,
  VSourceFinishUploadBody,
} from '$/validators';
import { validate } from './utils';

describe('VSourceCreateBodyWrapper', () => {
  it('should accept correct payloads', async () => {
    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: 'audio',
          audioFile: {
            type: 'audio',
            filename: 'test.mp3',
            fileSize: 1000,
          },
          cueSheetFile: null,
          region: 'ap-northeast-1',
        },
      })
    ).resolves.toBeUndefined();

    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: 'audio',
          audioFile: {
            type: 'audio',
            filename: 'test.wav',
            fileSize: 1000,
          },
          cueSheetFile: {
            type: 'cueSheet',
            filename: 'test.cue',
            fileSize: 200,
          },
          region: 'ap-northeast-1',
        },
      })
    ).resolves.toBeUndefined();

    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: 'image',
          imageFile: {
            type: 'image',
            filename: 'test.jpg',
            fileSize: 1000,
          },
          attachToType: 'album',
          attachToId: 'test',
          attachPrepend: true,
          region: 'ap-northeast-1',
        },
      })
    ).resolves.toBeUndefined();
  });

  it('should reject malformed payloads', async () => {
    // invalid region
    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: 'audio',
          audioFile: {
            type: 'audio',
            filename: 'test.mp3',
            fileSize: 1000,
          },
          cueSheetFile: null,
          region: 'ap-northeast-x' as any,
        },
      })
    ).rejects.toMatchSnapshot();

    // invalid id
    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: 'image',
          imageFile: {
            type: 'image',
            filename: 'test.jpg',
            fileSize: 1000,
          },
          attachToType: 'album',
          attachToId: '/test',
          attachPrepend: true,
          region: 'ap-northeast-1',
        },
      })
    ).rejects.toMatchSnapshot();

    // invalid file type
    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: 'audio',
          audioFile: {
            type: 'image' as any,
            filename: 'test.mp3',
            fileSize: 1000,
          },
          cueSheetFile: null,
          region: 'ap-northeast-1',
        },
      })
    ).rejects.toMatchSnapshot();

    // inconsistent type
    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: 'image' as any,
          audioFile: {
            type: 'audio' as any,
            filename: 'test.mp3',
            fileSize: 1000,
          },
          cueSheetFile: null,
          region: 'ap-northeast-1',
        },
      })
    ).rejects.toMatchSnapshot();

    // invalid type
    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: 'foo' as any,
          audioFile: {
            type: 'audio',
            filename: 'test.mp3',
            fileSize: 1000,
          },
          cueSheetFile: null,
          region: 'ap-northeast-1',
        },
      })
    ).rejects.toMatchSnapshot();

    // invalid type of type
    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          type: ['audio'] as any,
          audioFile: {
            type: 'audio',
            filename: 'test.mp3',
            fileSize: 1000,
          },
          cueSheetFile: null,
          region: 'ap-northeast-1',
        },
      })
    ).rejects.toMatchSnapshot();

    // missing type
    await expect(
      validate(VSourceCreateBodyWrapper, {
        '!payload': {
          audioFile: {
            type: 'audio',
            filename: 'test.mp3',
            fileSize: 1000,
          },
          cueSheetFile: null,
          region: 'ap-northeast-1',
        } as any,
      })
    ).rejects.toMatchSnapshot();
  });
});

describe('VSourceFinishUploadBody', () => {
  it('should accept correct payloads', async () => {
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
      })
    ).resolves.toBeUndefined();

    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: undefined,
      })
    ).resolves.toBeUndefined();

    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: ['etag1'],
      })
    ).resolves.toBeUndefined();

    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: ['etag1', 'etag2'],
      })
    ).resolves.toBeUndefined();
  });

  it('should reject malformed payloads', async () => {
    // invalid state
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploadable' as any,
      })
    ).rejects.toMatchSnapshot();

    // null parts
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: null as any,
      })
    ).rejects.toMatchSnapshot();

    // empty parts
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: [],
      })
    ).rejects.toMatchSnapshot();

    // invalid type of parts
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: [123] as any,
      })
    ).rejects.toMatchSnapshot();

    // object parts
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: { 0: 'etag1' } as any,
      })
    ).rejects.toMatchSnapshot();
  });
});
