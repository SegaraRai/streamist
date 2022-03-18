import { describe, expect, it } from 'vitest';
import { isReservedUsername } from '../src/reservedUsernames';

describe('reservedUsernames', () => {
  it('should return false for normal usernames', () => {
    expect(isReservedUsername('alice')).toBe(false);
    expect(isReservedUsername('bob')).toBe(false);
    expect(isReservedUsername('alice_bob')).toBe(false);
  });

  it('should return true for special usernames', () => {
    expect(isReservedUsername('admin')).toBe(true);
    expect(isReservedUsername('streamist')).toBe(true);

    expect(isReservedUsername('login')).toBe(true);
    expect(isReservedUsername('register')).toBe(true);
    expect(isReservedUsername('signin')).toBe(true);
    expect(isReservedUsername('signup')).toBe(true);
    expect(isReservedUsername('tos')).toBe(true);
    expect(isReservedUsername('404')).toBe(true);
  });

  it('should return true for usernames include admin or streamist', () => {
    expect(isReservedUsername('AdminAlice')).toBe(true);
    expect(isReservedUsername('bob_the_admin')).toBe(true);
    expect(isReservedUsername('StreamistAlice')).toBe(true);
    expect(isReservedUsername('bob_the_streamist')).toBe(true);
  });
});
