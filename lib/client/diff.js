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

function toObject(array) {
  return array.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
}

const pipe = (fn, ...fns) => arg => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

const log = (...ss) => ss.forEach(s => console.log(JSON.stringify(s, null, 2)));

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
    const nR = Math.trunc(n / 2) + 1;
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
var ElemType;

(function (ElemType) {
  ElemType[ElemType["added"] = 0] = "added";
  ElemType[ElemType["removed"] = 1] = "removed";
  ElemType[ElemType["common"] = 2] = "common";
})(ElemType || (ElemType = {}));

;

function getHeadR({
  m,
  n
}, headL) {
  return headR => {
    const [newHeadR] = recurse(([, parent]) => {
      return !!parent && headL.x - (m - parent.x - 1) > 1 && headL.y - (n - parent.y - 1) > 1;
    }, ([path = {
      parent: undefined
    }, parent = {
      parent: undefined
    }]) => {
      return [path.parent, parent.parent];
    })([headR, headR.parent]);
    return newHeadR;
  };
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
}, preResult) {
  return head => {
    const [, result] = recurse(([path]) => !!path, ([path, acc]) => {
      const {
        x,
        y,
        parent = {
          x: 0,
          y: 0
        }
      } = path;
      const diffX = x - parent.x;
      const diffY = y - parent.y;
      const undiffOrNull = getUndiff(x, Math.min(diffX, diffY));
      const diffOrNull = getDiff(diffX - diffY, parent);
      return [path.parent, getAcc([undiffOrNull, diffOrNull, [...undiffOrNull, ...diffOrNull], acc, acc])];
    })([head, preResult]);
    return result;
  };
}

exports.unifiedResult = unifiedResult;
exports.unifieds = {
  "L": ({
    a,
    b,
    flip
  }) => {
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
  },
  "R": ({
    a,
    b,
    m,
    n,
    flip
  }) => {
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

        if ((!prev || prev.common) && undiff && undiff.common) {
          return [...acc, ...diffOrNull];
        }

        if (diff && prev && (prev.added && diff.added || prev.removed && diff.removed)) {
          return [...tail, Object.assign({}, prev, {
            "value": prev.value + diff.value
          })];
        }

        return [...acc, ...undiffOrNull, ...diffOrNull];
      }
    };
  }
};
exports.Snakes = {
  "L": pMax => {
    return {
      onpCondition: (paths, n) => {
        return ([, {
          fp,
          k
        }]) => {
          if (fp < pMax) {
            return true;
          }

          return paths[k].snaked === 0 && fp < n;
        };
      },
      snakeLorR: ({
        a,
        b,
        m,
        n
      }) => {
        return (k, y1) => {
          const [x, y] = recurse(([x, y]) => x < m && y < n && a[x] === b[y], ([x, y]) => [x + 1, y + 1])([y1 - k, y1]);
          return [x, y, y];
        };
      }
    };
  },
  "R": pMax => {
    return {
      onpCondition: () => {
        return ([, {
          fp
        }]) => fp < pMax;
      },
      snakeLorR: ({
        a,
        b,
        m,
        n
      }) => {
        return (k, y1) => {
          const [x, y] = recurse(([x, y]) => x < m && y < n && a[m - x - 1] === b[n - y - 1], ([x, y]) => [x + 1, y + 1])([y1, y1 - k]);
          return [x, y, x];
        };
      }
    };
  }
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
      snaked: y - y1,
      parent
    });
  };
}

function Onp(source, offset, delta, rangeKN, rangeKM) {
  return ({
    snakeLorR,
    onpCondition
  }) => {
    const {
      m,
      n
    } = source;
    const paths = [];
    const fpk = new Array(m + n + 3).fill({
      "fp": -1,
      "k": -1
    });
    const snake = snakeOnp(offset, fpk, paths, snakeLorR(source));
    const [, {
      k
    }] = recurse(onpCondition(paths, n), ([p]) => {
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

exports.Onp = Onp;
/**
 * Diff main
 */

function diff(a, b, threshold = 100000) {
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
  const onp = Onp(source, offset, delta, rangeKN, rangeKM);

  if (n < threshold) {
    const headL = onp(exports.Snakes.L(nR));
    const resultL = unifiedResult(exports.unifieds.L(source), [])(headL);

    if (headL.x >= m && headL.y >= n) {
      return Promise.resolve(resultL);
    }

    const result = pipe(onp, getHeadR(source, headL), unifiedResult(exports.unifieds.R(source), resultL))(exports.Snakes.R(nL));
    return Promise.resolve(result);
  } else {
    const threads = require('threads');

<<<<<<< HEAD
    const thread = new threads.spawn();
=======
    const thread1 = new threads.spawn();
    const thread2 = new threads.spawn();
>>>>>>> refs/remotes/origin/feature/middle-snake
    threads.config.set({
      basepath: {
        node: __dirname,
        web: 'http://myserver.local/thread-scripts'
      }
    });
    return new Promise(resolve => {
<<<<<<< HEAD
      thread.run('thOnp.js');
      const promisHeadR = thread.send(['R', nR, {
=======
      thread1.run('thOnp.js');
      thread2.run('thOnp.js');
      Promise.all([thread1.send(['L', nL, {
>>>>>>> refs/remotes/origin/feature/middle-snake
        source,
        delta,
        offset,
        rangeKN,
        rangeKM
<<<<<<< HEAD
      }]).promise();
      const headL = onp(exports.Snakes.L(nL));
      promisHeadR.then(headR => {
        if (headL.x >= m && headL.y >= n) {
          const result = unifiedResult(exports.unifieds.L(source), [])(headL);
          resolve(result);
          thread.kill();
        } else {
          thread.run('thResult.js');
          const newHeadR = getHeadR(source, headL)(headR);
          const promiseResultR = thread.send(['R', source, newHeadR]).promise();
          const resultL = unifiedResult(exports.unifieds.L(source), [])(headL);
          promiseResultR.then(resultR => {
            resolve([].concat(...resultL, ...resultR));
            thread.kill();
=======
      }]).promise(), thread2.send(['R', nR, {
        source,
        delta,
        offset,
        rangeKN,
        rangeKM
      }]).promise()]).then(heads => {
        thread2.kill();
        const head = toObject(heads);

        if (head.L.x >= m && head.L.y >= n) {
          const resultL = unifiedResult(exports.unifieds.L(source), [])(head.L);
          resolve(resultL);
          thread1.kill();
        } else {
          thread1.run('thResult.js');
          const newHeadR = getHeadR(source, head.L)(head.R);
          const promiseResult = thread1.send(['R', source, newHeadR]).promise();
          const resultL = unifiedResult(exports.unifieds.L(source), [])(head.L);
          promiseResult.then(resultR => {
            resolve([].concat(...resultL, ...resultR));
            thread1.kill();
>>>>>>> refs/remotes/origin/feature/middle-snake
          });
        }
      });
    });
  }
}

exports.diff = diff;