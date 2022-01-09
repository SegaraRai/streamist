import '$/services/initOS';

import { describe, expect, it } from 'vitest';
import { VAuthBodyWrapper } from '$/validators';
import { validate } from './utils';

describe('VAuthBodyWrapper', () => {
  it('should accept correct payloads', async () => {
    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          grant_type: 'password',
          username: 'test_id',
          password: 'test_password',
        },
      })
    ).resolves.toBeUndefined();

    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          grant_type: 'refresh_token',
          refresh_token: 'test_refresh_token',
        },
      })
    ).resolves.toBeUndefined();
  });

  it('should reject malformed payloads', async () => {
    // invalid grant_type
    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          grant_type: 'foo' as any,
          username: 'test_id',
          password: 'test_password',
        },
      })
    ).rejects.toMatchSnapshot();

    // missing grant_type
    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          username: 'test_id',
          password: 'test_password',
        } as any,
      })
    ).rejects.toMatchSnapshot();

    // invalid password
    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          grant_type: 'password',
          username: 'test_id',
          password: 123 as any,
        },
      })
    ).rejects.toMatchSnapshot();

    // missing password
    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          grant_type: 'password',
          username: 'test_id',
        } as any,
      })
    ).rejects.toMatchSnapshot();

    // invalid refresh token
    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          grant_type: 'refresh_token',
          refresh_token: 123 as any,
        },
      })
    ).rejects.toMatchSnapshot();

    // missing refresh token
    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          grant_type: 'refresh_token',
        } as any,
      })
    ).rejects.toMatchSnapshot();

    // missing refresh token
    await expect(
      validate(VAuthBodyWrapper, {
        '!payload': {
          grant_type: 'refresh_token',
          refresh_token: null as any,
        } as any,
      })
    ).rejects.toMatchSnapshot();
  });
});
