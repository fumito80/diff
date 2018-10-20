'use strict';

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const http_1 = __importDefault(require("http"));

const fs_1 = __importDefault(require("fs"));

const util_1 = require("./common/util");

const consts_1 = require("./common/consts");

function getDefaultUrl(req) {
  return Promise.resolve(consts_1.consts.rootDir + (req.url === '/' ? consts_1.consts.defaultUrl : req.url));
}

function readFile(path) {
  return new Promise(resolve => {
    fs_1.default.readFile(path, consts_1.consts.serverEncoding, (err, data) => {
      if (err) {
        // console.error(path);
        return resolve([404, null]);
      }

      return resolve([200, data]);
    });
  });
}

function response(res) {
  return ([statusCode, page]) => {
    res.writeHead(statusCode, consts_1.consts.contentType);

    if (page) {
      res.write(page);
    }

    res.end();
    return Promise.resolve();
  };
}

function onRequest(req, res) {
  util_1.F.pipeP(getDefaultUrl, readFile, response(res))(req);
}

http_1.default.createServer().on('request', onRequest).listen(consts_1.consts.port, consts_1.consts.hostname, () => {
  console.log(`Server runnning at http://${consts_1.consts.hostname}:${consts_1.consts.port}/`);
});