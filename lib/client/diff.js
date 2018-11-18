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

const pipe = (fn, ...fns) => arg => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

const log = (...ss) => ss.forEach(s => console.log(JSON.stringify(s, null, 2)));

function stringToBuffer(src) {
  if (Array.isArray(src)) {
    return src;
  }

  return new Uint16Array([...src].map(c => c.charCodeAt(0))).buffer;
}

function bufferToString(buf) {
  if (!/ArrayBuffer/.test(toString.call(buf))) {
    return buf;
  }

  return String.fromCharCode.apply("", new Uint16Array(buf));
}

function init({
  a = '',
  b = ''
}) {
  const [m, n] = [a.length, b.length];

  function split({
    a,
    b
  }, {
    m,
    n,
    flip
  }) {
    const nL = Math.ceil(n / 2);
    const nR = Math.trunc(n / 2) + 1;
    return {
      "bufA": stringToBuffer(a),
      "bufB": stringToBuffer(b),
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
        "b": a
      }, {
        "m": n,
        "n": m,
        "flip": true
      });
    }

    return split({
      a,
      b
    }, {
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
    bufA,
    bufB,
    flip
  }) => {
    const [a, b] = [bufferToString(bufA), bufferToString(bufB)];
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
    bufA,
    bufB,
    m,
    n,
    flip
  }) => {
    const [a, b] = [bufferToString(bufA), bufferToString(bufB)];
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
        bufA,
        bufB,
        m,
        n
      }) => {
        const [a, b] = [bufferToString(bufA), bufferToString(bufB)];
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
        bufA,
        bufB,
        m,
        n
      }) => {
        const [a, b] = [bufferToString(bufA), bufferToString(bufB)];
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

function Onp(source, offset, delta, bufRangeKN, buRangeKM) {
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
    const [rangeKN, rangeKM] = [new Int32Array(bufRangeKN), new Int32Array(buRangeKM)];
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
  const delta = n - m; // const sBuffKN = new ArrayBuffer(n * Int32Array.BYTES_PER_ELEMENT);
  // const rangeKN = new Int32Array(sBuffKN, 0, n);
  // [...Array(n)].forEach((_, i) => rangeKN[i] = - (n - i) + delta);

  const sBuffKN = new Int32Array([...Array(n)].map((_, i) => -(n - i) + delta)).buffer; // const sBuffKM = new ArrayBuffer(m * Int32Array.BYTES_PER_ELEMENT + Int32Array.BYTES_PER_ELEMENT);
  // const rangeKM = new Int32Array(sBuffKM, 0, m + 1);
  // [...Array(m + 1)].forEach((_, i) => rangeKM[i] = m - i + delta);

  const sBuffKM = new Int32Array([...Array(m + 1)].map((_, i) => m - i + delta)).buffer;
  const onp = Onp(source, offset, delta, sBuffKN, sBuffKM);

  if (n < threshold) {
    const headL = onp(exports.Snakes.L(nR));
    const resultL = unifiedResult(exports.unifieds.L(source), [])(headL);

    if (headL.x >= m && headL.y >= n) {
      if (threshold === 0) {
        return resultL;
      }

      return Promise.resolve(resultL);
    }

    const result = pipe(onp, getHeadR(source, headL), unifiedResult(exports.unifieds.R(source), resultL))(exports.Snakes.R(nL));

    if (threshold === 0) {
      return result;
    }

    return Promise.resolve(result);
  } else {
    const {
      Worker
    } = require('worker_threads');

    const workerHeadR = new Worker(__dirname + '/thOnp.js', {
      workerData: ['R', nR, source, offset, delta, sBuffKN, sBuffKM]
    });
    const headL = onp(exports.Snakes.L(nL));
    return new Promise(resolve => {
      workerHeadR.on('message', headR => {
        if (headL.x >= m && headL.y >= n) {
          const result = unifiedResult(exports.unifieds.L(source), [])(headL);
          resolve(result);
        } else {
          const newHeadR = getHeadR(source, headL)(headR);
          const workerResultR = new Worker(__dirname + '/thResult.js', {
            workerData: ['R', source, newHeadR]
          });
          const resultL = unifiedResult(exports.unifieds.L(source), [])(headL);
          workerResultR.on('message', resultR => {
            resolve([].concat(...resultL, ...resultR));
          });
        }
      });
    });
  }
}

exports.diff = diff;