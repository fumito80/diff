"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const diff_1 = require("./diff");

const {
  parentPort,
  workerData
} = require('worker_threads');

const [which, n2, source, offset, delta, sBuffKN, sBuffKM] = workerData;
const result = diff_1.Onp(source, offset, delta, sBuffKN, sBuffKM)(diff_1.Snakes[which](n2));
parentPort.postMessage(result);