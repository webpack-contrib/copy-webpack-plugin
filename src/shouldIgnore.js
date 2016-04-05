import _ from 'lodash';
import minimatch from 'minimatch';

export default (pathName, ignoreList) => {
    const matched = _.find(ignoreList, (g) => {
        let glob,
            params;

        // Default minimatch params
        params = {
            matchBase: true
        };

        if (_.isString(g)) {
            glob = g;
        } else if (_.isObject(g)) {
            glob = g.glob || '';
            // Overwrite minimatch defaults
            params = _.assign(params, _.omit(g, ['glob']));
        } else {
            glob = '';
        }

        return minimatch(pathName, glob, params);
    });

    return Boolean(matched);
};
