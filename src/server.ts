'use strict';

import http from 'http';
import fs from 'fs';
import { F } from './common/util';
import { consts } from './common/consts';

type pageResult = [number, string | null];

function getDefaultUrl(req: http.IncomingMessage): Promise<string> {
  return Promise.resolve(consts.rootDir + (req.url === '/' ? consts.defaultUrl : req.url));
}

function readFile(path: string): Promise<pageResult> {
  return new Promise((resolve) => {
    fs.readFile(path, consts.serverEncoding, (err, data) => {
      if (err) {
        // console.error(path);
        return resolve([404, null]);
      }
      return resolve([200, data]);
    });
  });
}

function response(res: http.ServerResponse): { (pageResult): Promise<void> } {
  return ([statusCode, page]: pageResult) => {
    res.writeHead(statusCode, consts.contentType);
    if (page) {
      res.write(page);
    }
    res.end();
    return Promise.resolve();
  }
}

function onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  F.pipeP(
    getDefaultUrl,
    readFile,
    response(res)
  )(req);
}

http.createServer()
  .on('request', onRequest)
  .listen(consts.port, consts.hostname, () => {
    console.log(`Server runnning at http://${consts.hostname}:${consts.port}/`);
  });
