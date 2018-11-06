'use strict';

const diff = require('../lib/client/diff');
const fs = require('fs');
const path = require('path');
// const diff = require('wu-diff-js');
const ONP = require('./onp');
const jsDiff = require('diff');
// const jDiff = require('./jdiff');

// import { diff } from '../lib/client/diff';
// console.log(diff);

let src1 = [
  'AAA',
  'BBB',
  'CDC',
  'DAD',
];

let src2 = [
  'AAA',
  'BBB',
  'CCC',
  'DDD',
];

src1 = 'XABCDAXZZ';
src2 = 'XBFEABDBYZ';

// src1 = 'ADCBAX';
// src2 = 'DBAEFBX';

src1 = 'Determines the height of the cursor. Default is 1, meaning it spans the whole height of the line. For some fonts (and by some tastes) a smaller height (for example 0.85), which causes the cursor to not reach all the way to the bottom of the line, looks better';
src2 = 'Determines the height of the cursor. Default is 1, meaning it spans the whole height of the l87or some fonts (and by some tastes) a smaller height (for example 0.85), which causes the cursor to not reach all the way to the bottom of the line, looks better';

src1 = fs.readFileSync(path.join(__dirname, 'txt-codemirror-man1.txt')).toLocaleString();
src2 = fs.readFileSync(path.join(__dirname, 'txt-codemirror-man2.txt')).toLocaleString();

const start = Date.now();
console.log('start: ' + start);
// const A = diff.reverse(src1);
// const B = diff.reverse(src2);
mydiff();
// jsdiff();
// onp();
// wudiff();
let end = Date.now();
console.log('end: ' + end + ', lap: ' + (end - start));

function mydiff() {
  let ses = diff.diff(src1 || process.argv[2], src2 || process.argv[3]);
  // console.log(ses);

  ses.forEach(function(part){
    if (part.removed) {
        console.log("-" + part.value);
    } else if (part.added) {
      console.log("+" + part.value);
    } else {
      console.log(" " + part.value);
    }
  });
}

// const jdiff = new jDiff.UnifiedDiff(src1 || process.argv[2], src2 || process.argv[3], 1000);
// console.log(jdiff.toString());

function onp() {
  const onp = new ONP.Diff(src1 || process.argv[2], src2 || process.argv[3]);
  onp.compose();
  const ses = onp.getses();
  // console.log(ses);

  for (let i = 0; i < ses.length; ++i) {
    // if (ses[i].t === Diff.COMMON) {
    //   console.log(" " + ses[i].elem);
    // } else
    if (ses[i].t === onp.SES_DELETE) {
      console.log("-" + ses[i].elem);
    } else if (ses[i].t === onp.SES_ADD) {
      console.log("+" + ses[i].elem);
    }
  }
}

function wudiff() {
  let ses = diff.default(src1 || process.argv[2], src2 || process.argv[3]);

  for (let i = 0; i < ses.length; ++i) {
    // if (ses[i].t === Diff.COMMON) {
    //   console.log(" " + ses[i].value);
    // } else
    if (ses[i].type === 'removed') {
      console.log("-" + ses[i].value);
    } else if (ses[i].type === 'added') {
      console.log("+" + ses[i].value);
    }
  }
}

function jsdiff() {
  let jsdiff = jsDiff.diffChars(src1 || process.argv[2], src2 || process.argv[3]);
  
  jsdiff.forEach(function(part){
    // green for additions, red for deletions
    // grey for common parts
    // var color = part.added ? 'green' :
    //   part.removed ? 'red' : 'grey';
    // process.stderr.write(part.value[color]);
    if (part.removed) {
        console.log("-" + part.value);
    } else if (part.added) {
      console.log("+" + part.value);
    } else {
      console.log(" " + part.value);
    }
  });
}
