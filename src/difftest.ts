'use strict';

import { Diff } from './diff';

var ses = Diff.diff(process.argv[2], process.argv[3]);

for (let i = 0; i < ses.length; ++i) {
  if (ses[i].t === Diff.COMMON) {
    console.log(" " + ses[i].elem);
  } else if (ses[i].t === Diff.DELETE) {
    console.log("-" + ses[i].elem);
  } else if (ses[i].t === Diff.ADD) {
    console.log("+" + ses[i].elem);
  }
}
