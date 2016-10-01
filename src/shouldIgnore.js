import _ from 'lodash';
import minimatch from 'minimatch';

export default (pathName, ignoreList) => {
    const matched = _.find(ignoreList, (gb) => {
        let glob,
            params;

        // Default minimatch params
        params = {
            matchBase: true
        };

        if (_.isString(gb)) {
            glob = gb;
        } else if (_.isObject(gb)) {
            glob = gb.glob || '';
            // Overwrite minimatch defaults
            params = _.assign(params, _.omit(gb, ['glob']));
        } else {
            glob = '';
        }

        return minimatch(pathName, glob, params);
    });

    return Boolean(matched);
};
