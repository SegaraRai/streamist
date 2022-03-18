import '$/services/initOS';

import { describe, expect, it } from 'vitest';
import { VAuthBodyPassword } from '$/validators';
import { validate } from './utils';

describe('VAuthBodyWrapper', () => {
  it('should accept correct payloads', async () => {
    await expect(
      validate(VAuthBodyPassword, {
        grant_type: 'password',
        username: 'test_id',
        password: 'test_password',
      })
    ).resolves.toBeUndefined();
  });

  it('should reject malformed payloads', async () => {
    // invalid grant_type
    await expect(
      validate(VAuthBodyPassword, {
        grant_type: 'foo' as any,
        username: 'test_id',
        password: 'test_password',
      })
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "equals": "grant_type must be equal to password",
          },
          "property": "grant_type",
          "value": "foo",
        },
      ]
    `);

    // missing grant_type
    await expect(
      validate(VAuthBodyPassword, {
        username: 'test_id',
        password: 'test_password',
      } as any)
    ).rejects.toMatchInlineSnapshot(`
      [
        ValidationError {
          "children": [],
          "constraints": {
            "equals": "grant_type must be equal to password",
          },
          "property": "grant_type",
          "value": undefined,
        },
      ]
    `);

    // invalid username
    await expect(
      validate(VAuthBodyPassword, {
        grant_type: 'password',
        username: { toString: 'test_id' },
        password: 'test_password',
      } as any)
    ).rejects.toMatchSnapshot();

    // invalid password
    await expect(
      validate(VAuthBodyPassword, {
        grant_type: 'password',
        username: 'test_id',
        password: 123 as any,
      } as any)
    ).rejects.toMatchSnapshot();

    // missing password
    await expect(
      validate(VAuthBodyPassword, {
        grant_type: 'password',
        username: 'test_id',
      } as any)
    ).rejects.toMatchSnapshot();
  });
});
