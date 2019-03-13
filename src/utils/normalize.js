import path from 'path';

import normalizePath from 'normalize-path';

function escape(context, from) {
  if (from && path.isAbsolute(from)) {
    return from;
  }

  // Ensure context is escaped before globbing
  // Handles special characters in paths
  const absoluteContext = path
    .resolve(context)
    // Need refactor
    // eslint-disable-next-line no-useless-escape
    .replace(/[\*|\?|\!|\(|\)|\[|\]|\{|\}]/g, (substring) => `[${substring}]`);

  if (!from) {
    return absoluteContext;
  }

  // Cannot use path.join/resolve as it "fixes" the path separators
  if (absoluteContext.endsWith('/')) {
    return `${absoluteContext}${from}`;
  }

  return `${absoluteContext}/${from}`;
}

export default function normalize(context, from) {
  return normalizePath(escape(context, from));
}
