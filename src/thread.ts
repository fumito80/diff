import { Onp, Snakes, unifiedResult, unifieds } from './diff';

const pipe = (fn, ...fns) => (arg) => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

module.exports = function([type, which, data], done) {
  if (type === 'onp') {
    const { n, source, offset, delta, rangeKN, rangeKM } = data;
    pipe(Onp(source, offset, delta, rangeKN, rangeKM), done)(Snakes[which](n));
  } else {
    const [source, head] = data;
    pipe(unifiedResult(unifieds[which](source), []), done)(head);
  }
};
