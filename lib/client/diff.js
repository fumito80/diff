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
    if (m >= n) {
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

function getUnifiedResult(source, headL, headR) {
  const {
    m,
    n
  } = source;
  const [, resultL] = unifiedResult(unifiedResultL(source))(headL, []);
  const [head] = recurse(([, parent]) => !!parent && headL.x > m - parent.x - 1 && headL.y > n - parent.y - 1, ([pathR = {
    parent: undefined
  }, parent = {
    parent: undefined
  }]) => [pathR.parent, parent.parent])([headR, headR.parent]);

  if (!head) {
    return resultL;
  }

  const [, result] = unifiedResult(unifiedResultR(source))(head, resultL);
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

function unifiedResult([getUndiff, getDiff, getAcc]) {
  return (head, preResult) => {
    return recurse(([{
      x
    }]) => x > 0, ([{
      x,
      y,
      parent = {
        x: 0,
        y: 0
      }
    }, acc]) => {
      const diffX = x - parent.x;
      const diffY = y - parent.y;
      const undiffOrNull = getUndiff(x, Math.min(diffX, diffY));
      const diffOrNull = getDiff(diffX - diffY, parent);
      return [parent, getAcc([undiffOrNull, diffOrNull, [...undiffOrNull, ...diffOrNull], acc, acc])];
    })([head, preResult]);
  };
}

function unifiedResultL({
  a,
  b,
  flip
}) {
  return [function getUndiff(x, undiffs) {
    if (undiffs > 0) {
      return [makeElem(a.slice(x - undiffs, x), ElemType.common)];
    }

    return [];
  }, function getDiff(diffs, {
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
  }, function getAcc([undiffOrNull, diffOrNull, [diff], [prev, ...tail], acc]) {
    if (prev && (prev.added && diff.added || prev.removed && diff.removed)) {
      return [Object.assign({}, prev, {
        "value": diff.value + prev.value
      }), ...tail];
    }

    return [...diffOrNull, ...undiffOrNull, ...acc];
  }];
}

function unifiedResultR({
  a,
  b,
  m,
  n,
  flip
}) {
  return [function getUndiff(x, undiffs) {
    if (undiffs > 0) {
      return [makeElem(a.slice(m - x, m - x + undiffs), ElemType.common)];
    }

    return [];
  }, function getDiff(diffs, {
    x,
    y
  }) {
    if (diffs > 0) {
      return [makeElem(a[m - x - 1], flip ? ElemType.added : ElemType.removed)];
    }

    if (diffs < 0) {
      return [makeElem(b[n - y - 1], flip ? ElemType.removed : ElemType.added)];
    }

    return [];
  }, function getAcc([undiffOrNull, diffOrNull, [diff], acc]) {
    const [undiff] = undiffOrNull;
    const [prev] = acc.slice(-1);
    const tail = acc.slice(0, -1);

    if (prev.common && undiff && undiff.common) {
      return [...acc, ...diffOrNull];
    }

    if (prev.added && diff.added || prev.removed && diff.removed) {
      return [...tail, Object.assign({}, prev, {
        "value": prev.value + diff.value
      })];
    }

    return [...acc, ...undiffOrNull, ...diffOrNull];
  }];
}
/**
 * Snake
 */


const snakeConditionL = ({
  a,
  b,
  m,
  n
}) => ([x, y]) => x < m && y < n && a[x] === b[y];

const snakeConditionR = ({
  a,
  b,
  m,
  n
}) => ([x, y]) => x < m && y < n && a[m - x - 1] === b[n - y - 1];

function Snake(offset, fp, paths, condition) {
  return k => {
    const [p, pp] = [fp[k - 1 + offset].fp + 1, fp[k + 1 + offset].fp];
    const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
    const [x, y] = recurse(condition, ([x, y]) => [x + 1, y + 1])([y1 - k, y1]);
    fp[k + offset] = {
      "fp": y,
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
  return (nMax, snakeCondition) => {
    const {
      m,
      n
    } = source;
    const paths = [];
    const fpk = new Array(m + nMax + 3).fill({
      "fp": -1,
      "k": -1
    });
    const snake = Snake(offset, fpk, paths, snakeCondition(source));
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
  log(rangeKN, rangeKM);
  const onp = Onp(source, offset, delta, rangeKN, rangeKM);
  const headL = onp(nL, snakeConditionL);
  const headR = onp(nR + 3, snakeConditionR);
  return getUnifiedResult(source, headL, headR);
}

exports.diff = diff;