"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const diff_1 = require("./diff");

const pipe = (fn, ...fns) => arg => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

module.exports = function ([type, which, data], done) {
  if (type === 'onp') {
    const {
      n,
      source,
      delta,
      offset,
      rangeKN,
      rangeKM
    } = data;
    pipe(diff_1.Onp(source, delta, offset, rangeKN, rangeKM), done)(diff_1.Snakes[which](n));
  } else {
    const [source, head] = data;
    pipe(diff_1.unifiedResult(diff_1.unifieds[which](source), []), done)(head);
  }
};