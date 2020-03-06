export const ensureSlash = (value?: string) => {
  if (!value) {
    return '';
  }

  let v = value;

  if (v.startsWith('http')) {
    return v;
  }

  if (!v.startsWith('/')) {
    v = `/${v}`;
  }

  if (v.endsWith('/')) {
    v = v.replace(/\/+$/, '');
  }

  return v;
};
