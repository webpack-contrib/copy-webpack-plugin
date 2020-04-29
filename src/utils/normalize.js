import path from 'path';

import normalizePath from 'normalize-path';

function escape(context, from, fromIsGlob) {
  if (from && path.isAbsolute(from)) {
    if (!fromIsGlob) {
      return normalizePath(from);
    }

    if (from.indexOf(context) === 0) {
      return normalizePath(from);
    }

    return from;
  }

  // Ensure context is escaped before globbing
  // Handles special characters in paths
  let absoluteContext = normalizePath(path.resolve(context));
  absoluteContext = absoluteContext.replace(
    // eslint-disable-next-line no-useless-escape
    /[\*|\?|\!|\(|\)|\[|\]|\{|\}]/g,
    (substring) => `\\${substring}`
  );

  if (!from) {
    return absoluteContext;
  }

  // Cannot use path.join/resolve as it "fixes" the path separators
  if (absoluteContext.endsWith('/')) {
    return `${absoluteContext}${fromIsGlob ? from : normalizePath(from)}`;
  }

  return `${absoluteContext}/${fromIsGlob ? from : normalizePath(from)}`;
}

export default function normalize(context, from, fromIsGlob) {
  return escape(context, from, fromIsGlob);
}
