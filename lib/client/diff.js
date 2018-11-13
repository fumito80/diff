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

const log = (...ss) => ss.forEach(s => console.log(JSON.stringify(s, null, 2)));

var ElemType;

(function (ElemType) {
  ElemType[ElemType["added"] = 0] = "added";
  ElemType[ElemType["removed"] = 1] = "removed";
  ElemType[ElemType["common"] = 2] = "common";
})(ElemType || (ElemType = {}));

;
/**
 * Flip args(text) by length.
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
    const nL = Math.ceil(n / 2);
    const nR = Math.trunc(n / 2);
    return {
      a,
      b,
      m,
      n,
      nL,
      nR,
      flip
    };
  }

  function orFlip({
    a,
    b
  }) {
    if (m > n) {
      return split({
        "a": b,
        "b": a,
        "m": n,
        "n": m,
        "flip": true,
        "nL": 0,
        "nR": 0
      });
    }

    return split({
      a,
      b,
      m,
      n,
      "flip": false,
      "nR": 0,
      "nL": 0
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

function getUnifiedResult(source, headL, headR) {
  const {
    m,
    n
  } = source;
  // const [newHeadL, newHeadR] = recurse(([,, parentL, parentR]) => {
  //   return !!parentL && !!parentR && parentL.x - (m - parentR.x - 1) > 1 && parentL.y - (n - parentR.y - 1) > 1;
  // }, ([pathL = {
  //   parent: undefined
  // }, pathR = {
  //   parent: undefined
  // }, parentL = {
  //   parent: undefined
  // }, parentR = {
  //   parent: undefined
  // }]) => {
  //   return [pathL.parent, pathR.parent, parentL.parent, parentR.parent];
  // })([headL, headR, headL.parent, headR.parent]);
  // const [, resultL] = unifiedResult(unifiedL(source))(headL, []);
  // return resultL;

  // if (!newHeadR || newHeadL.x >= m && newHeadL.y >= n) {
  //   return resultL;
  // }

  const [, result] = unifiedResult(unifiedR(source))(headR, [], m);
  return result;
}

function makeElem(value, t) {
  return {
    value,
    added: t === ElemType.added,
    removed: t === ElemType.removed,
    common: t === ElemType.common
  };
}

function unifiedResult({
  getUndiff,
  getDiff,
  getAcc
}) {
  return (head, preResult, m) => {
    return recurse(([path]) => !!path, ([path, acc]) => {
      const {
        x,
        y,
        parent = {
          x: 0,
          y: 0
        }
      } = path;
      const overX = Math.min(m - x - 1, 0);
      const overXparent = Math.min(m - parent.x - 1, 0);
      const diffX = (x - overX) - (parent.x - overXparent);
      const diffY = (y - overX) - (parent.y - overXparent);
      const undiffOrNull = getUndiff(x, Math.min(diffX, diffY));
      const diffOrNull = getDiff(diffX - diffY, parent);
      return [path.parent, getAcc([undiffOrNull, diffOrNull, [...undiffOrNull, ...diffOrNull], acc, acc])];
    })([head, preResult]);
  };
}

function unifiedL({
  a,
  b,
  flip
}) {
  return {
    getUndiff: (x, undiffs) => {
      if (undiffs > 0) {
        return [makeElem(a.slice(x - undiffs, x), ElemType.common)];
      }

      return [];
    },
    getDiff: (diffs, {
      x,
      y
    }) => {
      if (diffs > 0) {
        return [makeElem(a[x], flip ? ElemType.added : ElemType.removed)];
      }

      if (diffs < 0) {
        return [makeElem(b[y], flip ? ElemType.removed : ElemType.added)];
      }

      return [];
    },
    getAcc: ([undiffOrNull, diffOrNull, [diff], [prev, ...tail], acc]) => {
      if (prev && (prev.added && diff.added || prev.removed && diff.removed)) {
        return [Object.assign({}, prev, {
          "value": diff.value + prev.value
        }), ...tail];
      }

      return [...diffOrNull, ...undiffOrNull, ...acc];
    }
  };
}

function unifiedR({
  a,
  b,
  m,
  n,
  flip
}) {
  return {
    getUndiff: (x, undiffs) => {
      if (undiffs > 0) {
        return [makeElem(a.slice(m - x, m - x + undiffs), ElemType.common)];
      }

      return [];
    },
    getDiff: (diffs, {
      x,
      y
    }) => {
      if (diffs > 0) {
        return [makeElem(a[m - x - 1], flip ? ElemType.added : ElemType.removed)];
      }

      if (diffs < 0) {
        return [makeElem(b[n - y - 1], flip ? ElemType.removed : ElemType.added)];
      }

      return [];
    },
    getAcc: ([undiffOrNull, diffOrNull, [diff], acc]) => {
      const [undiff] = undiffOrNull;
      const [prev] = acc.slice(-1);
      const tail = acc.slice(0, -1);

      if (prev && prev.common && undiff && undiff.common) {
        return [...acc, ...diffOrNull];
      }

      if (prev && diff && (prev.added && diff.added || prev.removed && diff.removed)) {
        return [...tail, Object.assign({}, prev, {
          "value": prev.value + diff.value
        })];
      }

      return [...acc, ...undiffOrNull, ...diffOrNull];
    }
  };
}
/**
 * Snake
 */


const snakeL = ({
  a,
  b,
  m,
  n
}) => {
  return (k, y1) => {
    const [x, y] = recurse(([x, y]) => x < m && y < n && a[x] === b[y], ([x, y]) => [x + 1, y + 1])([y1 - k, y1]);
    return [x, y, y];
  };
};

const snakeR = ({
  a,
  b,
  m,
  n
}) => {
  return (k, y1) => {
    if (m - y1 - 1 < 0) {
      log(k, y1, m);
      // return [y1, y1 - k, y1];
    }
    const [x, y] = recurse(([x, y]) => {
      const overX = Math.min(m - x - 1, 0);
      return x < n && y < n && a[Math.max(m - x - 1, 0)] === b[n - y - 1 + overX];
    }, ([x, y]) => {
      return [x + 1, y + 1];
    })([y1, y1 - k]);
    return [x, y, x];
  };
};

function snakeOnp(offset, fp, paths, snake) {
  return k => {
    const [p, pp] = [fp[k - 1 + offset].fp + 1, fp[k + 1 + offset].fp];
    const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
    const [x, y, fpValue] = snake(k, y1);
    fp[k + offset] = {
      "fp": fpValue,
      "k": paths.length
    };
    const parent = paths[fp[k + dir + offset].k];
    paths.push({
      x,
      y,
      parent
    });
  };
}

;
/**
 * ONP main
 */

function Onp(source, offset, delta, rangeKN, rangeKM) {
  return (nMax, snakeLorR) => {
    const {
      m,
      n
    } = source;
    const paths = [];
    const fpk = new Array(n + n + 3).fill({
      "fp": -1,
      "k": -1
    });
    const snake = snakeOnp(offset, fpk, paths, snakeLorR(source));
    const [, {
      k
    }] = recurse(([, {
      fp
    }]) => fp < nMax, ([p]) => {
      rangeKN.slice(n - p).forEach(snake);
      rangeKM.slice(m - p + delta).forEach(snake);
      return [p + 1, fpk[delta + offset]];
    })([delta, {
      "fp": -1,
      "k": -1
    }]);
    return paths[k];
  };
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
    nL,
    nR
  } = source;
  const offset = m + 1;
  const delta = n - m;
  const rangeKN = [...Array(n)].map((_, i) => -(n - i) + delta);
  const rangeKM = [...Array(m + 1)].map((_, i) => m - i + delta);
  const onp = Onp({ b, a, m, n, flip: source.flip }, offset, delta, rangeKN, rangeKM);
  const headL = onp(n, snakeL);
  const headR = onp(n, snakeR);
  log(headR);

  return getUnifiedResult(source, headL, headR);
}

exports.diff = diff;