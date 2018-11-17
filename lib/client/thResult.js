"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const diff_1 = require("./diff");

module.exports = function ([which, source, head], done) {
  const result = diff_1.unifiedResult(diff_1.unifieds[which](source))(head, []);
  done(result);
};