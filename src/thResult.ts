import { unifiedResult, unifieds } from './diff';

module.exports = function([which, source, head], done) {
  const result = unifiedResult(unifieds[which](source))(head, []);
  done(result);
};
