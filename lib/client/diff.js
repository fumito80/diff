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

function init(_a, _b) {
  const [m, n] = [_a.length, _b.length];

  function ret(a, b) {
    if (m >= n) {
      return {
        "a": b,
        "b": a,
        "m": n,
        "n": m,
        "flip": true
      };
    }

    return {
      a,
      b,
      m,
      n,
      "flip": false
    };
  }

  if (typeof _a === 'string' && typeof _b === 'string') {
    return ret(_a, _b);
  }

  if (Array.isArray(_a) && Array.isArray(_b)) {
    return ret(_a, _b);
  }

  return ret(String(_a), String(_b));
}

;

function diff2({
  a,
  b,
  flip
}, pathList) {
  const ses = [];
  recurse(({
    parent
  }) => parent != null, ({
    x,
    y,
    parent
  }) => {
    const diffX = x - parent.x;
    const diffY = y - parent.y;
    const sameLen = Math.min(diffX, diffY);

    if (sameLen > 0) {
      ses.unshift({
        "elem": a.slice(x - sameLen, x),
        "t": DiffType.COMMON
      });
    }

    if (diffY < diffX) {
      ses.unshift({
        "elem": a[parent.x],
        "t": flip ? DiffType.ADD : DiffType.DELETE
      });
    } else if (diffX < diffY) {
      ses.unshift({
        "elem": b[parent.y],
        "t": flip ? DiffType.DELETE : DiffType.ADD
      });
    }

    return parent;
  })(pathList);
  return ses;
}

function snake({
  a,
  b,
  m,
  n
}) {
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
    const source = init(str1, str2);
    const {
      m,
      n
    } = source;
    const offset = m + 1;
    const delta = n - m;
    const size = m + n + 3;
    const pathList = [];
    const path = new Array(size).fill({
      "k": -1,
      "fp": -1
    });

    function setPath([k, dir, x, y]) {
      path[k + offset] = {
        "k": pathList.length,
        "fp": y
      };
      pathList.push({
        x,
        y,
        parent: pathList[path[k + dir + offset].k]
      });
    }

    recurse(_ => path[delta + offset].fp !== n, p => {
      [[-p, ([k]) => k < delta, ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp], 1], [delta + p, ([k]) => k > delta, ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp], -1]].forEach(([init, condition, fp, addK]) => {
        recurse(condition, pipe(fp, snake(source), tap(setPath), ([k]) => [k + addK]))(fp([init]));
      });
      pipe(snake(source), tap(setPath))([delta, path[delta - 1 + offset].fp + 1, path[delta + 1 + offset].fp]);
      return p + 1;
    })(0);
    console.log(JSON.stringify(pathList, null, 4));
    return diff2(source, pathList[path[delta + offset].k]);
  }

  Diff.diff = diff;
})(Diff = exports.Diff || (exports.Diff = {}));