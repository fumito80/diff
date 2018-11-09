'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Common Functions
 */

function recurse(cbCondition, cbRecurse) {
  function run(arg) {
    var _repeat = true;

    var _arg;

    while (_repeat) {
      _repeat = false;

      if (cbCondition(arg)) {
        _arg = cbRecurse(arg);
        arg = _arg;
        _repeat = true;
        continue;
      }

      return arg;
    }
  }

  return run;
}

var ElemType;

(function (ElemType) {
  ElemType[ElemType["added"] = 0] = "added";
  ElemType[ElemType["removed"] = 1] = "removed";
  ElemType[ElemType["common"] = 2] = "common";
})(ElemType || (ElemType = {}));

;
/**
 * Initialize
 */

function init({
  a = '',
  b = ''
}) {
  const [m, n] = [a.length, b.length];

  function split({
    a,
    b,
    m,
    n,
    flip
  }) {
    const na = Math.ceil(n / 2);
    const nb = Math.trunc(n / 2);
    return {
      a,
      b,
      m,
      n,
      na,
      nb,
      flip
    };
  }

  function orFlip({
    a,
    b
  }) {
    if (m >= n) {
      return split({
        "a": b,
        "b": a,
        "m": n,
        "n": m,
        "flip": true
      });
    }

    return split({
      a,
      b,
      m,
      n,
      "flip": false
    });
  }

  if (typeof a === 'string' && typeof b === 'string' || Array.isArray(a) && Array.isArray(b)) {
    return orFlip({
      a,
      b
    });
  }

  return orFlip({
    a: String(a),
    b: String(b)
  });
}

;
/**
 * Format result
 */

function unifiedResult({
  a,
  b,
  flip
}, paths, k) {
  function makeElem(value, t) {
    return {
      value,
      added: t === ElemType.added,
      removed: t === ElemType.removed,
      common: t === ElemType.common
    };
  }

  function getUndiff(x, undiffs) {
    if (undiffs > 0) {
      return [makeElem(a.slice(x - undiffs, x), ElemType.common)];
    }

    return [];
  }

  function getDiff(diffs, {
    x,
    y
  }) {
    if (diffs > 0) {
      return [makeElem(a[x], flip ? ElemType.added : ElemType.removed)];
    }

    if (diffs < 0) {
      return [makeElem(b[y], flip ? ElemType.removed : ElemType.added)];
    }

    return [];
  }

  function getAcc([undiff, diffOrNull, [diff], [prev, ...tail], acc]) {
    if (prev && (prev.added && diff.added || prev.removed && diff.removed)) {
      return [Object.assign({}, prev, {
        "value": diff.value + prev.value
      }), ...tail];
    }

    return [...diffOrNull, ...undiff, ...acc];
  }

  const [, result] = recurse(([path]) => !!path, ([{
    x,
    y,
    r
  }, acc]) => {
    const parent = paths[r] || {
      x: 0,
      y: 0
    };
    const diffX = x - parent.x;
    const diffY = y - parent.y;
    const undiff = getUndiff(x, Math.min(diffX, diffY));
    const diffOrNull = getDiff(diffX - diffY, parent);
    return [paths[r], getAcc([undiff, diffOrNull, [...undiff, ...diffOrNull], acc, acc])];
  })([paths[k], []]);
  return result;
}

function getPaths(source, delta, offset, fpMax) {
  function Snake({
    a,
    b,
    m,
    n
  }) {
    return (k, i) => {
      const [p, pp] = [fp[k - 1 + offset].fp + 1, fp[k + 1 + offset].fp];
      const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
      const [x, y] = recurse(([x, y]) => x < m && y < n && a[x] === b[y], ([x, y]) => [x + 1, y + 1])([y1 - k, y1]);
      fp[k + offset] = {
        "fp": y,
        "k": i
      };
      return {
        x,
        y,
        r: fp[k + dir + offset].k
      };
    };
  }

  ;
  const fp = new Array(fpMax).fill({
    "fp": -1,
    "k": -1
  });
  const snake = Snake(source);
  let p = delta;
  let i = 0;
  return [[...{
    *[Symbol.iterator]() {
      while (fp[delta + offset].fp < source.n) {
        for (let k = -p; k < delta; k++) {
          yield snake(k, i++);
        }

        for (let k = delta + p; k >= delta; k--) {
          yield snake(k, i++);
        }

        p++;
      }
    }

  }], fp[delta + offset].k];
}
/**
 * Diff main
 */


function diff(a, b) {
  const source = init({
    a,
    b
  });
  const {
    m,
    n,
    nb
  } = source;
  const offset = m + 1;
  const delta = n - m;
  const fpMax = m + n + 3;
  const [paths, k] = getPaths(source, delta, offset, fpMax);
  return unifiedResult(source, paths, k);
}

exports.diff = diff;