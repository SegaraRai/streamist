import '$/services/initOS';

import { describe, expect, it } from 'vitest';
import { VAuthBodyRefreshToken } from '$/validators';
import { validate } from './utils';

describe('VAuthBodyRefreshToken', () => {
  it('should accept correct payloads', async () => {
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'refresh_token',
        refresh_token: 'test_refresh_token',
      })
    ).resolves.toBeUndefined();
  });

  it('should reject malformed payloads', async () => {
    // invalid grant_type
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'foo' as any,
        refresh_token: 'test_refresh_token',
      })
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "equals": "grant_type must be equal to refresh_token",
          },
          "property": "grant_type",
          "value": "foo",
        },
      ]
    `);

    // invalid grant_type
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'password',
        username: 'test_id',
        password: 'test_password',
      } as any)
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "equals": "grant_type must be equal to refresh_token",
          },
          "property": "grant_type",
          "value": "password",
        },
        ValidationError {
          "children": [],
          "constraints": {
            "isNotEmpty": "refresh_token should not be empty",
            "isString": "refresh_token must be a string",
          },
          "property": "refresh_token",
          "value": undefined,
        },
      ]
    `);

    // missing grant_type
    await expect(
      validate(VAuthBodyRefreshToken, {
        refresh_token: 'test_refresh_token',
      } as any)
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "equals": "grant_type must be equal to refresh_token",
          },
          "property": "grant_type",
          "value": undefined,
        },
      ]
    `);

    // invalid refresh token
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'refresh_token',
        refresh_token: 123 as any,
      })
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "isString": "refresh_token must be a string",
          },
          "property": "refresh_token",
          "value": 123,
        },
      ]
    `);

    // missing refresh token
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'refresh_token',
      } as any)
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "isNotEmpty": "refresh_token should not be empty",
            "isString": "refresh_token must be a string",
          },
          "property": "refresh_token",
          "value": undefined,
        },
      ]
    `);

    // missing refresh token
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'refresh_token',
        refresh_token: null as any,
      } as any)
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "isNotEmpty": "refresh_token should not be empty",
            "isString": "refresh_token must be a string",
          },
          "property": "refresh_token",
          "value": null,
        },
      ]
    `);
  });
});
