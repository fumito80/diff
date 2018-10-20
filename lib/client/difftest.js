'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const diff_1 = require("./diff");

var ses = diff_1.Diff.diff(process.argv[2], process.argv[3]); // ses.forEach(function(part){
//   // green for additions, red for deletions
//   // grey for common parts
//   var color = part.t === Diff.SES_ADD ? 'green' :
//     part.t === Diff.SES_DELETE ? 'red' : 'grey';
//   process.stderr.write(part.elem[color]);
// });

for (let i = 0; i < ses.length; ++i) {
  if (ses[i].t === diff_1.Diff.COMMON) {
    console.log(" " + ses[i].elem);
  } else if (ses[i].t === diff_1.Diff.DELETE) {
    console.log("-" + ses[i].elem);
  } else if (ses[i].t === diff_1.Diff.ADD) {
    console.log("+" + ses[i].elem);
  }
}