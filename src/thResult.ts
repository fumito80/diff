import { unifiedResult, unifieds } from './diff';
const { parentPort, workerData } = require('worker_threads');

const [which, source, head] = workerData;
const result = unifiedResult(unifieds[which](source), [])(head);
parentPort.postMessage(result);
