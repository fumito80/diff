'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const tap = f => a => {
  f(a);
  return a;
};

const pipe = (fn, ...fns) => arg => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

function recurse(cbCondition, cbRecurse) {
  function run(arg) {
    var _repeat = true;

    var _arg;

    while (_repeat) {
      _repeat = false;

      if (!cbCondition(arg)) {
        return arg;
      }

      _arg = cbRecurse(arg);
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

var seq;

(function (seq) {
  seq[seq["X"] = 0] = "X";
  seq[seq["Y"] = 1] = "Y";
  seq[seq["K"] = 2] = "K";
})(seq || (seq = {}));

;

function init(a, b) {
  function ret(_a, _b) {
    const [m, n] = [_a.length, _b.length];

    if (m >= n) {
      return [_b, _a, n, m, true];
    }

    return [_a, _b, m, n, false];
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return ret(a, b);
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return ret(a, b);
  }

  return ret(String(a), String(b));
}

;

function recordseq(epc, a, b, reverse) {
  function selectPath(diffYX) {
    return ([px, py]) => {
      if (diffYX === py - px) {
        return [a[px], DiffType.COMMON, px + 1, py + 1];
      }

      if (diffYX > py - px) {
        return [b[py], reverse ? DiffType.DELETE : DiffType.ADD, px, py + 1];
      } // if (y - x < py - px)


      return [a[px], reverse ? DiffType.ADD : DiffType.DELETE, px + 1, py];
    };
  }

  const ses = [];
  epc.reduce(([px, py], [x, y]) => {
    return recurse(([px, py]) => px < x || py < y, pipe(selectPath(y - x), ([elem, t, px, py]) => [px, py, ses.push({
      elem,
      t
    })]))([px, py]);
  }, [0, 0]);
  return ses;
}

;

function snake(a, b, m, n, path, offset) {
  return ([k, p, pp]) => {
    const [y1, dir] = p > pp ? [p, DiffType.DELETE] : [pp, DiffType.ADD];
    const [x, y] = recurse(([x, y]) => x < m && y < n && a[x] === b[y], ([x, y]) => [x + 1, y + 1])([y1 - k, y1]);
    return [k, dir, x, y];
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
    const epc = [];
    const path = new Array(size).fill({
      "k": -1,
      "fp": -1
    });

    function setPath([k, dir, x, y]) {
      path[k + offset] = {
        "k": pathpos.length,
        "fp": y
      };
      pathpos.push([x, y, path[k + dir + offset].k]);
    }

    recurse(_ => path[delta + offset].fp !== n, p => {
      [[-p, ([k]) => k < delta, ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp], 1], [delta + p, ([k]) => k > delta, ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp], -1]].forEach(([init, comparator, fp, addK]) => {
        recurse(comparator, pipe(fp, snake(a, b, m, n, path, offset), tap(setPath), ([k]) => [k + addK]))(fp([init]));
      });
      pipe(snake(a, b, m, n, path, offset), tap(setPath))([delta, path[delta - 1 + offset].fp + 1, path[delta + 1 + offset].fp]);
      return p + 1;
    })(0);
    recurse(r => r !== -1, r => {
      const [x, y, k] = pathpos[r];
      epc.unshift([x, y]);
      return k;
    })(path[delta + offset].k);
    return recordseq(epc, a, b, reverse);
  }

  Diff.diff = diff;
})(Diff = exports.Diff || (exports.Diff = {}));