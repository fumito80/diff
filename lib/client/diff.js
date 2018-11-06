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

function reverse(src, len = Number.MAX_SAFE_INTEGER) {
  let dest = '';
  const start = src.length - 1;
  const end = Math.max(src.length - len, 0);

  for (let i = start; i >= end; dest += src[i], i--);

  return dest;
}

function init({
  a,
  b
}) {
  const [m, n] = [a.length, b.length];

  function split(source) {
    return source;
    const n = Math.ceil(source.n / 2);
    const nb = Math.trunc(source.n / 2);
    const a = reverse(source.a);
    const b = reverse(source.b);
    return {
      a,
      b,
      m,
      n: source.n,
      nb,
      flip: source.flip
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
        "nb": 0,
        "flip": true
      });
    }

    return split({
      a,
      b,
      m,
      n,
      "nb": 0,
      "flip": false
    });
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return orFlip({
      a,
      b
    });
  }

  if (Array.isArray(a) && Array.isArray(b)) {
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

function unifiedResult({
  a,
  b,
  flip
}, head) {
  function getUndiff(x, undiffs) {
    if (undiffs > 0) {
      return [{
        "value": a.slice(x - undiffs, x),
        "added": false,
        "removed": false,
        "common": true
      }];
    }

    return [];
  }

  function getDiff(diffs, {
    x,
    y
  }) {
    if (diffs > 0) {
      return [{
        "value": a[x],
        "added": flip,
        "removed": !flip,
        "common": false
      }];
    }

    if (diffs < 0) {
      return [{
        "value": b[y],
        "added": !flip,
        "removed": flip,
        "common": false
      }];
    }

    return [];
  }

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
      const diff = getDiff(diffX - diffY, parent);
      const [last] = acc.slice(-1);
      const [next] = nextFun(diff, undiff);

      if (last && next && (last.added && next.added || last.removed && next.removed)) {
        const {
          added,
          removed
        } = last;
        return [...acc.slice(0, -1), {
          "value": last.value + next.value,
          added,
          removed
        }, ...undiff];
      }

      return [...acc, ...nextFun(diff, undiff)];
    }, []);
  }

  const pathList = linkedListToArray(head, 'parent');
  return unified(pathList, Array.prototype.reduceRight, (diff, undiff) => [...diff, ...undiff]);
}

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
  const kListMax = m + n + 3;
  const pathList = [];
  const kLogs = new Array(kListMax).fill({
    "k": -1,
    "fp": -1
  });
  const rangesMinusK = [...Array(n)].map((_, i) => -(n - i) + delta);
  const rangesPlusK = [...Array(m + 1)].map((_, i) => m - i + delta);

  function Snake({
    a,
    b,
    m,
    n
  }) {
    return k => {
      const [p, pp] = [kLogs[k - 1 + offset].fp + 1, kLogs[k + 1 + offset].fp];
      const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
      const [x, y] = recurse(([x, y]) => x < m && y < n && a[x] === b[y], ([x, y]) => [x + 1, y + 1])([y1 - k, y1]);
      return [k, dir, x, y];
    };
  }

  ;

  function setPath([k, dir, x, y]) {
    kLogs[k + offset] = {
      "k": pathList.length,
      "fp": y
    };
    const parent = pathList[kLogs[k + dir + offset].k];
    pathList.push({
      x,
      y,
      parent
    });
  }

  function onp(n) {
    const snake = Snake(source);
    const [, {
      k
    }] = recurse(([, {
      fp
    }]) => fp < n, ([p]) => {
      [...rangesMinusK.slice(n - p), ...rangesPlusK.slice(m - p + delta)].map(pipe(snake, tap(setPath)));
      return [p + 1, kLogs[delta + offset]];
    })([delta, {
      "k": -1,
      "fp": -1
    }]);
    return pathList[k];
  }

  const head = onp(n); // console.log(JSON.stringify(pathList, null, 4)); // See all paths.

  return unifiedResult(source, head);
}

exports.diff = diff;