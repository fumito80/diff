import { Onp, Snakes, unifiedResult, unifieds } from './diff';

const pipe = (fn, ...fns) => (arg) => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

module.exports = function([type, which, data], done) {
  if (type === 'onp') {
    const { n, source, delta, offset, rangeKN, rangeKM } = data;
    pipe(Onp(source, delta, offset, rangeKN, rangeKM), done)(Snakes[which](n));
  } else {
    const [source, head] = data;
    pipe(unifiedResult(unifieds[which](source), []), done)(head);
  }
};
