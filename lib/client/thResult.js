"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const diff_1 = require("./diff");

const {
  parentPort,
  workerData
} = require('worker_threads');

const [which, source, head] = workerData;
const result = diff_1.unifiedResult(diff_1.unifieds[which](source), [])(head);
parentPort.postMessage(result);