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

function linkedListToArray(head, parentKey) {
  let next = Object.assign({}, head, {
    [parentKey]: head
  });
  return [...{
    *[Symbol.iterator]() {
      while (next = next[parentKey]) yield next;
    }

  }];
}

function init({
  a,
  b
}) {
  const [m, n] = [a.length, b.length];

  function orFlip({
    a,
    b
  }) {
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
        "common": true,
        "added": false,
        "removed": false
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

  const pathList = linkedListToArray(head, 'parent');
  return pathList.reduceRight((acc, {
    x,
    y,
    parent = {
      x: 0,
      y: 0
    }
  }) => {
    const diffX = x - parent.x;
    const diffY = y - parent.y;
    const ses = [...getDiff(diffX - diffY, parent), ...getUndiff(x, Math.min(diffX, diffY))];
    const last = acc[acc.length - 1];
    const next = ses[0];

    if (last && (last.added && next.added || last.removed && next.removed)) {
      return [...acc.slice(0, -1), {
        "value": last.value + next.value,
        "added": last.added,
        "removed": last.removed
      }, ...ses.slice(1)];
    }

    return [...acc, ...ses];
  }, []);
}

function Snake({
  a,
  b,
  m,
  n
}) {
  return ([k, pathList, p, pp]) => {
    const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
    const [x, y] = recurse(([x, y]) => x < m && y < n && a[x] === b[y], ([x, y]) => [x + 1, y + 1])([y1 - k, y1]);
    return [k, pathList, dir, x, y];
  };
}

;
var Diff;

(function (Diff) {
  function diff(a, b) {
    const source = init({
      a,
      b
    });
    const {
      m,
      n
    } = source;
    const offset = m + 1;
    const delta = n - m;
    const kListMax = m + n + 3;
    const kList = new Array(kListMax).fill({
      "k": -1,
      "fp": -1
    });
    const snake = Snake(source);

    function getFP([k, pathList]) {
      return [k, pathList, kList[k - 1 + offset].fp + 1, kList[k + 1 + offset].fp];
    }

    function setK([k, pathList,,, y]) {
      kList[k + offset] = {
        "k": pathList.length,
        "fp": y
      };
    }

    function setPath(addK) {
      return ([k, pathList, dir, x, y]) => {
        const parent = pathList[kList[k + dir + offset].k];
        pathList.push({
          x,
          y,
          parent
        });
        return [k + addK, pathList];
      };
    }

    const [,, pathList] = recurse(([fp]) => fp !== n, ([, p, pathList]) => {
      [[-p, ([k]) => k < delta, 1], [delta + p, ([k]) => k > delta, -1], [delta, ([k]) => k === delta, -1]].forEach(([init, condition, addK]) => {
        recurse(condition, pipe(getFP, snake, tap(setK), setPath(addK)))(getFP([init, pathList]));
      });
      return [kList[delta + offset].fp, p + 1, pathList];
    })([0, 0, []]); // console.log(JSON.stringify(pathList, null, 4)); // See all paths.

    const head = pathList[kList[delta + offset].k];
    return unifiedResult(source, head);
  }

  Diff.diff = diff;
})(Diff = exports.Diff || (exports.Diff = {}));