"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const diff_1 = require("./diff");

module.exports = function ([which, n, {
  source,
  offset,
  delta,
  rangeKN,
  rangeKM
}], done) {
  const result = diff_1.Onp(source, offset, delta, rangeKN, rangeKM)(diff_1.Snakes[which](n));
  done([which, result]);
};