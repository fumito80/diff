import { Onp, Snakes } from './diff';
const { parentPort, workerData } = require('worker_threads');

const [which, n2, source, offset, delta, rangeKN, rangeKM] = workerData;
const result = Onp(source, offset, delta, rangeKN, rangeKM)(Snakes[which](n2));
parentPort.postMessage(result);
