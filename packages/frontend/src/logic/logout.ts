import { tokens } from './tokens';

export function logout(): void {
  // though all data are remain in localStorage and IndexedDB...
  localStorage.removeItem('refreshToken');
  tokens.clear();
}
