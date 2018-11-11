'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Common Functions
 */

const pipe = (fn, ...fns) => arg => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

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

function linkedListToArray(head, parentKey) {
  let next = Object.assign({}, head, {
    [parentKey]: head
  });
  return [...{
    *[Symbol.iterator]() {
      while (next = next[parentKey]) {
        yield next;
      }
    }

  }];
}

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
}, head) {
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

  const [, result] = recurse(([{
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
    const undiff = getUndiff(x, Math.min(diffX, diffY));
    const diffOrNull = getDiff(diffX - diffY, parent);
    return [parent, getAcc([undiff, diffOrNull, [...undiff, ...diffOrNull], acc, acc])];
  })([head, []]);
  return result;
}

function unifiedResultR({
  a,
  b,
  m,
  n,
  flip
}, head) {
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
      return [makeElem(a.slice(m - x, m - x + undiffs), ElemType.common)];
    }

    return [];
  }

  function getDiff(diffs, {
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
  } // function getAcc([undiff, diffOrNull, [diff], acc]: Ses[][]): Ses[] {
  //   const [prev] = acc.slice(- 1);
  //   const tail = acc.slice(0, - 1);
  //   if (prev && ((prev.added && diff.added) || (prev.removed && diff.removed))) {
  //     return [...tail, Object.assign({}, prev, { "value": prev.value + diff.value })];
  //   }
  //   return [...acc, ...undiff, ...diffOrNull];
  // }


  function getAcc([undiff, diffOrNull, [diff], [prev, ...tail], acc]) {
    if (prev && (prev.added && diff.added || prev.removed && diff.removed)) {
      return [Object.assign({}, prev, {
        "value": diff.value + prev.value
      }), ...tail];
    }

    return [...undiff, ...diffOrNull, ...acc];
  } // const [, result] = recurse<[Path, Ses[]]>(
  //   ([{ x }]) => x > 0,
  //   ([{ x, y, parent = { x: 0, y: 0 } }, acc]) => {
  //     const diffX = x - parent.x;
  //     const diffY = y - parent.y;
  //     const undiff = getUndiff(x, Math.min(diffX, diffY));
  //     const diffOrNull = getDiff(diffX - diffY, parent);
  //     return [parent, getAcc([undiff, diffOrNull, [...undiff, ...diffOrNull], acc, acc])];
  //   }
  // )([head, []]);
  // return result;


  function unified(pathList, reduceFun, nextFun) {
    return reduceFun.call(pathList, (acc, {
      x,
      y,
      parent = {
        x: 0,
        y: 0
      }
    }) => {
      const diffX = x - parent.x;
      const diffY = y - parent.y;
      const undiff = getUndiff(x, Math.min(diffX, diffY));
      const diffOrNull = getDiff(diffX - diffY, parent);
      return getAcc([undiff, diffOrNull, [...undiff, ...diffOrNull], acc, acc]); // const [last] = acc.slice(-1);
      // const [next] = nextFun(diff, undiff);
      // if (last && next && ((last.added && next.added) || (last.removed && next.removed))) {
      //   const { added, removed } = last;
      //   return [...acc.slice(0, -1), { "value": last.value + next.value, added, removed }, ...undiff] as Ses[];
      // }
      // return [...acc, ...nextFun(diff, undiff)] as Ses[];
    }, []);
  }

  const pathList = linkedListToArray(head, 'parent');
  return unified(pathList, Array.prototype.reduceRight, (diff, undiff) => [...diff, ...undiff]);
}
/**
 * Snake
 */


function Snake(condition) {
  return ([k, dir, x, y]) => {
    const [xx, yy] = recurse(condition, ([xx, yy]) => [xx + 1, yy + 1])([x, y]);
    return [k, dir, xx, yy];
  };
}

;

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
  const paths = [];
  const fp = new Array(fpMax).fill({
    "fp": -1,
    "k": -1
  });
  const rangeKN = [...Array(n)].map((_, i) => -(n - i) + delta);
  const rangeKM = [...Array(m + 1)].map((_, i) => m - i + delta);
  const snakeL = pipe(preSnake, Snake(snakeConditionL(source)), postSnake);
  const snakeR = pipe(preSnake, Snake(snakeConditionR(source)), postSnake);

  function preSnake(k) {
    const [p, pp] = [fp[k - 1 + offset].fp + 1, fp[k + 1 + offset].fp];
    const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
    return [k, dir, y1 - k, y1];
  }

  function postSnake([k, dir, x, y]) {
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
  }

  function onp(n, snake) {
    const [, {
      k
    }] = recurse(([, {
      fp
    }]) => fp < n, ([p]) => {
      rangeKN.slice(n - p).forEach(snake);
      rangeKM.slice(m - p + delta).forEach(snake);
      return [p + 1, fp[delta + offset]];
    })([delta, {
      "fp": -1,
      "k": -1
    }]);
    return paths[k];
  }

  const l = (...ss) => ss.forEach(s => console.log(JSON.stringify(s, null, 2)));

  const head = onp(n, snakeR);
  l(head);
  return unifiedResultR(source, head);
}

exports.diff = diff;