import { Onp, Snakes } from './diff';

module.exports = function([which, n, { source, offset, delta, rangeKN, rangeKM }], done) {
  const result = Onp(source, offset, delta, rangeKN, rangeKM)(Snakes[which](n));
  done(result);
};
