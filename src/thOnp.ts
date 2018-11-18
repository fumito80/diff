import { Onp, Snakes } from './diff';
const { parentPort, workerData } = require('worker_threads');

const [which, n2, source, offset, delta, sBuffKN, sBuffKM] = workerData;
const result = Onp(source, offset, delta, sBuffKN, sBuffKM)(Snakes[which](n2));
parentPort.postMessage(result);
