import '$/services/initOS';

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
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [
            ValidationError {
              "children": [],
              "constraints": {
                "isRegionConstraint": "region must be a valid region",
              },
              "property": "region",
              "value": "ap-northeast-x",
            },
          ],
          "property": "!payload",
          "value": VSourceCreateBodyAudio {
            "audioFile": VSourceCreateBodyAudioFile {
              "fileSize": 1000,
              "filename": "test.mp3",
              "type": "audio",
            },
            "cueSheetFile": null,
            "region": "ap-northeast-x",
            "type": "audio",
          },
        },
      ]
    `);

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
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [
            ValidationError {
              "children": [],
              "constraints": {
                "isIdConstraint": "attachToId must be a valid id",
              },
              "property": "attachToId",
              "value": "/test",
            },
          ],
          "property": "!payload",
          "value": VSourceCreateBodyImage {
            "attachPrepend": true,
            "attachToId": "/test",
            "attachToType": "album",
            "imageFile": VSourceCreateBodyImageFile {
              "fileSize": 1000,
              "filename": "test.jpg",
              "type": "image",
            },
            "region": "ap-northeast-1",
            "type": "image",
          },
        },
      ]
    `);

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
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [
            ValidationError {
              "children": [
                ValidationError {
                  "children": [],
                  "constraints": {
                    "equals": "type must be equal to audio",
                  },
                  "property": "type",
                  "value": "image",
                },
              ],
              "property": "audioFile",
              "value": VSourceCreateBodyAudioFile {
                "fileSize": 1000,
                "filename": "test.mp3",
                "type": "image",
              },
            },
          ],
          "property": "!payload",
          "value": VSourceCreateBodyAudio {
            "audioFile": VSourceCreateBodyAudioFile {
              "fileSize": 1000,
              "filename": "test.mp3",
              "type": "image",
            },
            "cueSheetFile": null,
            "region": "ap-northeast-1",
            "type": "audio",
          },
        },
      ]
    `);

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
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [
            ValidationError {
              "children": [],
              "constraints": {
                "isIn": "attachToType must be one of the following values: album, artist, playlist",
              },
              "property": "attachToType",
              "value": undefined,
            },
            ValidationError {
              "children": [],
              "constraints": {
                "isIdConstraint": "attachToId must be a valid id",
              },
              "property": "attachToId",
              "value": undefined,
            },
            ValidationError {
              "children": [],
              "constraints": {
                "isBoolean": "attachPrepend must be a boolean value",
              },
              "property": "attachPrepend",
              "value": undefined,
            },
          ],
          "property": "!payload",
          "value": VSourceCreateBodyImage {
            "audioFile": {
              "fileSize": 1000,
              "filename": "test.mp3",
              "type": "audio",
            },
            "cueSheetFile": null,
            "region": "ap-northeast-1",
            "type": "image",
          },
        },
      ]
    `);

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
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [
            ValidationError {
              "constraints": {
                "nestedValidation": "nested property !payload must be either object or array",
              },
              "property": "!payload",
              "target": [Function],
              "value": true,
            },
          ],
          "constraints": {
            "isObject": "type must be either \\"audio\\" or \\"image\\"",
          },
          "property": "!payload",
          "value": true,
        },
      ]
    `);

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
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [
            ValidationError {
              "constraints": {
                "nestedValidation": "nested property !payload must be either object or array",
              },
              "property": "!payload",
              "target": [Function],
              "value": true,
            },
          ],
          "constraints": {
            "isObject": "type must be either \\"audio\\" or \\"image\\"",
          },
          "property": "!payload",
          "value": true,
        },
      ]
    `);

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
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [
            ValidationError {
              "constraints": {
                "nestedValidation": "nested property !payload must be either object or array",
              },
              "property": "!payload",
              "target": [Function],
              "value": true,
            },
          ],
          "constraints": {
            "isObject": "type must be either \\"audio\\" or \\"image\\"",
          },
          "property": "!payload",
          "value": true,
        },
      ]
    `);
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
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "isIn": "state must be one of the following values: upload_aborted, upload_failed, uploaded",
          },
          "property": "state",
          "value": "uploadable",
        },
      ]
    `);

    // null parts
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: null as any,
      })
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "arrayNotEmpty": "parts should not be empty",
            "isArray": "parts must be an array",
            "isString": "each value in parts must be a string",
          },
          "property": "parts",
          "value": null,
        },
      ]
    `);

    // empty parts
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: [],
      })
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "arrayNotEmpty": "parts should not be empty",
          },
          "property": "parts",
          "value": [],
        },
      ]
    `);

    // invalid type of parts
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: [123] as any,
      })
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "isString": "each value in parts must be a string",
          },
          "property": "parts",
          "value": [
            123,
          ],
        },
      ]
    `);

    // object parts
    await expect(
      validate(VSourceFinishUploadBody, {
        state: 'uploaded',
        parts: { 0: 'etag1' } as any,
      })
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "arrayNotEmpty": "parts should not be empty",
            "isArray": "parts must be an array",
            "isString": "each value in parts must be a string",
          },
          "property": "parts",
          "value": {
            "0": "etag1",
          },
        },
      ]
    `);
  });
});
