import _ from 'lodash';
import path from 'path';

export default (pattern) => {
    const filename = pattern.to || '';

    return pattern.toType !== 'file' && (
        path.extname(filename) === '' ||
        _.last(filename) === path.sep ||
        _.last(filename) === '/' ||
        pattern.toType === 'dir'
    );
};
