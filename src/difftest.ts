'use strict';

import { Diff } from './diff';

var ses = Diff.diff(process.argv[2], process.argv[3]);

// ses.forEach(function(part){
//   // green for additions, red for deletions
//   // grey for common parts
//   var color = part.t === Diff.SES_ADD ? 'green' :
//     part.t === Diff.SES_DELETE ? 'red' : 'grey';
//   process.stderr.write(part.elem[color]);
// });

for (let i = 0; i < ses.length; ++i) {
  if (ses[i].t === Diff.COMMON) {
    console.log(" " + ses[i].elem);
  } else if (ses[i].t === Diff.DELETE) {
    console.log("-" + ses[i].elem);
  } else if (ses[i].t === Diff.ADD) {
    console.log("+" + ses[i].elem);
  }
}
