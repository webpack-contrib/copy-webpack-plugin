import normalizePath from 'normalize-path';

const normalizePatternFrom = (pattern) => {
  /* eslint-disable no-param-reassign */

  if (typeof pattern.from === 'string') {
    pattern.from = normalizePath(pattern.from);
  } else if (
    typeof pattern.from === 'object' &&
    typeof pattern.from.glob === 'string'
  ) {
    pattern.from = {
      ...pattern.from,
      glob: normalizePath(pattern.from.glob),
    };
  }
  return pattern;
};

export default normalizePatternFrom;
