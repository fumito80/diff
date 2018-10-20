'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const I = a => a;

const pipe = (fn, ...fns) => arg => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

function recurse(comparator, fn, post = I) {
  function run(arg) {
    var _repeat = true;

    var _arg;

    while (_repeat) {
      _repeat = false;

      if (!comparator(arg)) {
        return post(arg);
      }

      _arg = fn(arg);
      arg = _arg;
      _repeat = true;
      continue;
    }
  }

  return run;
}

var DiffType;

(function (DiffType) {
  DiffType[DiffType["DELETE"] = -1] = "DELETE";
  DiffType[DiffType["COMMON"] = 0] = "COMMON";
  DiffType[DiffType["ADD"] = 1] = "ADD";
})(DiffType || (DiffType = {}));

function init(a, b) {
  const m = a.length;
  const n = b.length;

  if (m >= n) {
    return [b, a, n, m, true];
  }

  return [a, b, m, n, false];
}

;

function recordseq(epc, a, b, reverse) {
  function selctPath([idx, ses, px, py]) {
    if (epc[idx].y - epc[idx].x > py - px) {
      return [idx, ses, b[py], reverse ? DiffType.DELETE : DiffType.ADD, px, py + 1];
    }

    if (epc[idx].y - epc[idx].x < py - px) {
      return [idx, ses, a[px], reverse ? DiffType.ADD : DiffType.DELETE, px + 1, py];
    }

    return [idx, ses, a[px], DiffType.COMMON, px + 1, py + 1];
  }

  return recurse(([idx]) => idx >= 0, recurse(([idx,, px, py]) => px < epc[idx].x || py < epc[idx].y, pipe(selctPath, ([idx, ses, elem, t, px, py]) => [idx, [].concat(ses, {
    elem,
    t
  }), px, py]), ([idx, ses, px, py]) => [idx - 1, ses, px, py]), ([, ses]) => ses)([epc.length - 1, [], 0, 0]);
}

;

function snake(a, b, m, n, path, offset) {
  return ([k, p, pp]) => {
    const [y1, dir] = p > pp ? [p, DiffType.DELETE] : [pp, DiffType.ADD];
    const [x, y] = recurse(([x, y]) => x < m && y < n && a[x] === b[y], ([x, y]) => [x + 1, y + 1])([y1 - k, y1]);
    return [k, {
      "xy": {
        x,
        y
      },
      "k": path[k + dir + offset].row
    }];
  };
}

;
var Diff;

(function (Diff) {
  Diff.DELETE = DiffType.DELETE, Diff.COMMON = DiffType.COMMON, Diff.ADD = DiffType.ADD;

  function diff(str1, str2) {
    const [a, b, m, n, reverse] = init(str1, str2);
    const offset = m + 1;
    const delta = n - m;
    const size = m + n + 3;
    const pathpos = [];
    const path = Array(size).fill({
      "row": -1,
      "fp": -1
    });

    function setPath([k, p]) {
      path[k + offset] = {
        "row": pathpos.length,
        "fp": p.xy.y
      };
      pathpos.push(p);
      return k;
    }

    recurse(_ => path[delta + offset].fp !== n, counter => {
      [[-counter, ([k]) => k < delta, ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp], k => [k + 1]], [delta + counter, ([k]) => k > delta, ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp], k => [k - 1]], [delta, ([k]) => k === delta, ([k]) => [k, path[delta - 1 + offset].fp + 1, path[delta + 1 + offset].fp], k => [k + 1]]].map(([init, comparator, fp, nextK]) => {
        recurse(comparator, pipe(fp, snake(a, b, m, n, path, offset), setPath, nextK))(fp([init]));
      });
      return counter + 1;
    })(-1);
    const [epc] = recurse(([, r]) => r !== -1, ([epc, r]) => [epc.concat(pathpos[r].xy), pathpos[r].k])([[], path[delta + offset].row]);
    return recordseq(epc, a, b, reverse);
  }

  Diff.diff = diff;
})(Diff = exports.Diff || (exports.Diff = {}));