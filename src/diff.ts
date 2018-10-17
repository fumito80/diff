'use strict';

export namespace Diff {

  export const SES_DELETE = -1;
  export const SES_COMMON = 0;
  export const SES_ADD    = 1;

  type Pathpos = { x: number, y: number, k: number };

  function init(_a, _b) {
    const m = _a.length;
    const n = _b.length;
    if (m >= n) {
      return [_b, _a, n, m, true];
    }
    return [_a, _b, m, n];
  };

  const P = (x, y, k): Pathpos => ({ x, y, k });

  function snake(k, p, pp, a, b, m, n, path, offset, pathpos) {
    
    function incXY(x, y) {
      if (!(x < m && y < n && a[x] === b[y])) {
        return [x, y];
      }
      return incXY(x + 1, y + 1);
    }

    const dir = p > pp ? -1 : 1;
    const r = path[k + dir + offset];
    const y1 = Math.max(p, pp);
    const [x, y] = incXY(y1 - k, y1);

    path[k + offset] = pathpos.length;
    pathpos[pathpos.length] = P(x, y, r);
    return y;
  };

  function recordseq(epc, a, b, reverse) {
    const seselem = (elem, t) => ({ elem, t });
    let px_idx = 0;
    let py_idx = 0;

    let ses: any[] = [];
    // let lcs = 0;

    for (let i = epc.length-1; i >= 0; --i) {
      while(px_idx < epc[i].x || py_idx < epc[i].y) {
        if (epc[i].y - epc[i].x > py_idx - px_idx) {
          ses[ses.length] = seselem(b[py_idx], reverse ? Diff.SES_DELETE : Diff.SES_ADD);
          ++py_idx;
        } else if (epc[i].y - epc[i].x < py_idx - px_idx) {
          ses[ses.length] = seselem(a[px_idx], reverse ? Diff.SES_ADD : Diff.SES_DELETE);
          ++px_idx;
        } else {
          ses[ses.length] = seselem(a[px_idx], Diff.SES_COMMON);
          // lcs += a[px_idx];
          ++px_idx;
          ++py_idx;
        }
      }
    }
    return ses;
  };

  export function diff(a, b) {
    const [_a, _b, m, n, reverse] = init(a, b);
    const offset = m + 1;

    // let ed = 0;
    // let ses = [];
    // let lcs = '';

    // return {
      // SES_DELETE : -1,
      // SES_COMMON :  0,
      // SES_ADD    :  1,

      // editdistance: function () {
      //   return ed;
      // },
      // getlcs: function () {
      //   return lcs;
      // },
      // getses: function () {
      //   return ses;
      // },
      // compose: function () {
        let path = {};
        let pathpos: Pathpos[] = [];
        const delta = n - m;
        const size  = m + n + 3;
        let fp = {};
        for (let i = 0; i < size; ++i) {
          fp[i] = -1;
          path[i] = -1;
        }
        let p = -1;
        do {
          ++p;
          for (let k = -p; k <= delta - 1; ++k) {
            fp[k+offset] = snake(k, fp[k-1+offset]+1, fp[k+1+offset], a, b, m, n, path, offset, pathpos);
          }
          for (let k= delta + p; k >= delta + 1; --k) {
            fp[k+offset] = snake(k, fp[k-1+offset]+1, fp[k+1+offset], a, b, m, n, path, offset, pathpos);
          }
          fp[delta+offset] = snake(delta, fp[delta-1+offset]+1, fp[delta+1+offset], a, b, m, n, path, offset, pathpos);
        } while (fp[delta+offset] !== n);
        
        // ed = delta + 2 * p;
        
        let r = path[delta + offset];
        
        const epc: Pathpos[] = [];
        while (r !== -1) {
          epc.push(P(pathpos[r].x, pathpos[r].y, null));
          r = pathpos[r].k;
        }
        const ses = recordseq(epc, a, b, reverse);
        return ses;
      // }
    // };
  }
}
