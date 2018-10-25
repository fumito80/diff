'use strict';

const { Diff } = require('../lib/client/diff');
const fs = require('fs');
const path = require('path');
const diff = require('wu-diff-js');
const ONP = require('./onp');
const jsDiff = require('diff');
const jDiff = require('./jdiff');

console.log(diff.default);

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

src1 = 'ABCDA';
src2 = 'BFEABD';


src1 = fs.readFileSync(path.join(__dirname, 'txt-codemirror-man1.txt')).toLocaleString();
src2 = fs.readFileSync(path.join(__dirname, 'txt-codemirror-man2.txt')).toLocaleString();

const start = Date.now();
console.log('start: ' + start);

const ses = Diff.diff(src1 || process.argv[2], src2 || process.argv[3]);
console.log(ses);

for (let i = 0; i < ses.length; ++i) {
  if (ses[i].t === Diff.COMMON) {
    console.log(" " + ses[i].elem);
  } else
  if (ses[i].t === Diff.DELETE) {
    console.log("-" + ses[i].elem);
  } else if (ses[i].t === Diff.ADD) {
    console.log("+" + ses[i].elem);
  }
}

// const jdiff = new jDiff.UnifiedDiff(src1 || process.argv[2], src2 || process.argv[3], 1000);
// console.log(jdiff.toString());

// const onp = new ONP.Diff(src1 || process.argv[2], src2 || process.argv[3]);
// onp.compose();
// const ses = onp.getses();
// // console.log(ses);

// for (let i = 0; i < ses.length; ++i) {
//   // if (ses[i].t === Diff.COMMON) {
//   //   console.log(" " + ses[i].elem);
//   // } else
//   if (ses[i].t === onp.SES_DELETE) {
//     console.log("-" + ses[i].elem);
//   } else if (ses[i].t === onp.SES_ADD) {
//     console.log("+" + ses[i].elem);
//   }
// }

// const ses = diff.default(Array.from(src1 || process.argv[2]), Array.from(src2 || process.argv[3]));

// for (let i = 0; i < ses.length; ++i) {
//   // if (ses[i].t === Diff.COMMON) {
//   //   console.log(" " + ses[i].elem);
//   // } else
//   if (ses[i].type === 'removed') {
//     console.log("-" + ses[i].value);
//   } else if (ses[i].type === 'added') {
//     console.log("+" + ses[i].value);
//   }
// }

// const one = 'beep boop';
// const other = 'beep boob blah';
 
// var jsdiff = jsDiff.diffChars(src1 || process.argv[2], src2 || process.argv[3]);
 
// jsdiff.forEach(function(part){
//   // green for additions, red for deletions
//   // grey for common parts
//   // var color = part.added ? 'green' :
//   //   part.removed ? 'red' : 'grey';
//   // process.stderr.write(part.value[color]);
//   if (part.removed) {
//     console.log("-" + part.value);
//   } else if (part.added) {
//     console.log("+" + part.value);
//   }
// });

let end = Date.now();
console.log('end: ' + end + ', lap: ' + (end - start));
