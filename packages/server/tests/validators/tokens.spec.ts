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
    ).rejects.toMatchSnapshot();

    // invalid grant_type
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'password',
        username: 'test_id',
        password: 'test_password',
      } as any)
    ).rejects.toMatchSnapshot();

    // missing grant_type
    await expect(
      validate(VAuthBodyRefreshToken, {
        refresh_token: 'test_refresh_token',
      } as any)
    ).rejects.toMatchSnapshot();

    // invalid refresh token
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'refresh_token',
        refresh_token: 123 as any,
      })
    ).rejects.toMatchSnapshot();

    // missing refresh token
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'refresh_token',
      } as any)
    ).rejects.toMatchSnapshot();

    // missing refresh token
    await expect(
      validate(VAuthBodyRefreshToken, {
        grant_type: 'refresh_token',
        refresh_token: null as any,
      } as any)
    ).rejects.toMatchSnapshot();
  });
});
