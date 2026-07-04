const NPM_NAME_RE = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function isValidNpmName(name: string): boolean {
  if (!name || name.length > 214) return false;
  if (name.startsWith('.') || name.startsWith('_')) return false;
  return NPM_NAME_RE.test(name);
}

export function isValidPathSegment(name: string): boolean {
  if (!name) return false;
  if (/[\\/:*?"<>|]/.test(name)) return false;
  if (name === '.' || name === '..') return false;
  return true;
}
