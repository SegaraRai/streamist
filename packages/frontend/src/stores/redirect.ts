import type { Router } from 'vue-router';

const redirectMap = new Map<string, string>();

export function setRedirect(from: string, to: string) {
  redirectMap.set(from, to);
}

export function getRedirect(from: string): string | undefined {
  return redirectMap.get(from);
}

export function tryRedirect(router: Router): boolean {
  const currentPath = router.currentRoute.value.path;
  const redirectTo = getRedirect(currentPath);
  // console.log('tryRedirect', currentPath, redirectTo);
  if (redirectTo) {
    router.replace(redirectTo);
    return true;
  }
  return false;
}
