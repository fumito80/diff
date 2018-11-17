'use strict';

import threads from 'threads';

/**
 * Common Functions
 */

type Recurse<T> = { (cbCondition: (a: T) => boolean, cbRecurse: (a: T) => T): (arg: T) => T }

function recurse<T>(cbCondition: { (a: T): boolean }, cbRecurse: { (a: T): T }) {
  function run(arg: T): T {
    if (cbCondition(arg)) {
      return run(cbRecurse(arg));
    }
    return arg;
  }
  return run;
}

const log = (...ss) => ss.forEach(s => console.log(JSON.stringify(s, null, 2)));

/**
 * Pre process
 */

type Source = {
  "a": string | string[],
  "b": string | string[],
  "m": number,
  "n": number,
  "nL": number,
  "nR": number,
  "flip": boolean
};

function init({ a = '', b = '' }: { a: string | string[], b: string | string[] }): Source {
  const [m, n] = [a.length, b.length];
  function split({ a, b, m, n, flip }: Source): Source {
    const nL = Math.ceil(n / 2);
    const nR = Math.trunc(n / 2) + 1;
    return { a, b, m, n, nL, nR, flip };
  }
  function orFlip({ a, b }): Source {
    if (m > n) {
      return split({ "a": b, "b": a, "m": n, "n": m, "flip": true, "nL": 0, "nR": 0 });
    }
    return split({ a, b, m, n, "flip": false, "nR": 0, "nL": 0  });
  }
  if ((typeof a === 'string' && typeof b === 'string') || (Array.isArray(a) && Array.isArray(b))) {
    return orFlip({ a, b });
  }
  return orFlip({ a: String(a), b: String(b) });
};

/**
 * Format result
 */

type Path = {
  "x": number,
  "y": number,
  "snaked": number,
  "parent"?: Path
};

type Ses = {
  "value": string,
  "added": boolean,
  "removed": boolean,
  "common": boolean
};

enum ElemType { added, removed, common };

type UnifiedResultFuns = {
  getUndiff: { (x: number, undiffs: number): Ses[] },
  getDiff:   { (diffs: number, parent: { x: number, y: number }): Ses[] },
  getAcc:    { ([undiffOrNull, diffOrNull, [diff], [prev, ...tail], acc]: Ses[][]): Ses[] }
};

function getHeadR({ m, n }: Source, headL: Path, headR: Path) {
  const [newHeadR] = recurse<[Path | undefined, Path | undefined]>(
    ([, parent]) => {
      return !!parent
        && headL.x - (m - parent.x - 1) > 1
        && headL.y - (n - parent.y - 1) > 1;
    },
    ([path = { parent: undefined }, parent = { parent: undefined }]) => {
      return [path.parent, parent.parent];
    }
  )([headR, headR.parent]);
  return newHeadR;
}

function toKeyValue<T>(array: [string, T][]) {
  return array.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {} as { [key: string]: T });
}

function makeElem(value: string, t: ElemType) {
  return { value, added: t === ElemType.added, removed: t === ElemType.removed, common: t === ElemType.common };
}

export function unifiedResult({ getUndiff, getDiff, getAcc }: UnifiedResultFuns) {
  return (head: Path, preResult: Ses[]) => {
    const [, result] = recurse<[Path, Ses[]]>(
      ([path]) => !!path,
      ([path, acc]) => {
        const { x, y, parent = { x: 0, y: 0 } } = path;
        const diffX = x - parent.x;
        const diffY = y - parent.y;
        const undiffOrNull = getUndiff(x, Math.min(diffX, diffY));
        const diffOrNull = getDiff(diffX - diffY, parent);
        return [path.parent as Path, getAcc([undiffOrNull, diffOrNull, [...undiffOrNull, ...diffOrNull], acc, acc])];
      }
    )([head, preResult]);
    return result;
  }
}

export const unifieds = {
  "L": ({ a, b, flip }): UnifiedResultFuns => {
    return {
      getUndiff: (x, undiffs): [Ses] | never[] => {
        if (undiffs > 0) {
          return [makeElem(a.slice(x - undiffs, x) as string, ElemType.common)];
        }
        return [];
      },
      getDiff: (diffs: number, { x, y }): [Ses] | never[] => {
        if (diffs > 0) {
          return [makeElem(a[x], flip ? ElemType.added : ElemType.removed)];
        }
        if (diffs < 0) {
          return [makeElem(b[y], flip ? ElemType.removed : ElemType.added)];
        }
        return [];
      },
      getAcc: ([undiffOrNull, diffOrNull, [diff], [prev, ...tail], acc]: Ses[][]): Ses[] => {
        if (prev && ((prev.added && diff.added) || (prev.removed && diff.removed))) {
          return [Object.assign({}, prev, { "value": diff.value + prev.value }), ...tail];
        }
        return [...diffOrNull, ...undiffOrNull, ...acc];
      }
    };
  },
  "R": ({ a, b, m, n, flip }): UnifiedResultFuns => {
    return {
      getUndiff: (x, undiffs): [Ses] | never[] => {
        if (undiffs > 0) {
          return [makeElem(a.slice(m - x, m - x + undiffs) as string, ElemType.common)];
        }
        return [];
      },
      getDiff: (diffs: number, { x, y }): [Ses] | never[] => {
        if (diffs > 0) {
          return [makeElem(a[m - x - 1], flip ? ElemType.added : ElemType.removed)];
        }
        if (diffs < 0) {
          return [makeElem(b[n - y - 1], flip ? ElemType.removed : ElemType.added)];
        }
        return [];
      },
      getAcc: ([undiffOrNull, diffOrNull, [diff], acc]: Ses[][]): Ses[] => {
        const [undiff] = undiffOrNull;
        const [prev] = acc.slice(- 1);
        const tail = acc.slice(0, - 1);
        if (!prev && undiff && undiff.common) {
          return [...acc, ...diffOrNull];
        }
        if (diff && prev && ((prev.added && diff.added) || (prev.removed && diff.removed))) {
          return [...tail, Object.assign({}, prev, { "value": prev.value + diff.value })];
        }
        return [...acc, ...undiffOrNull, ...diffOrNull];
      }
    }
  }
}

/**
 * Diff ONP
 */

type Fpk = {
  "fp": number,
  "k": number
};

type Snake = { (k: number, y1: number): [number, number, number] };
type SnakeLorR = {
  snakeLorR: { (s: Source): Snake },
  onpCondition: { (paths: Path[], n: number): { ([p, fp]: [number, Fpk]): boolean } }
};

export const Snakes = {
  "L": (pMax: number): SnakeLorR => {
    return {
      onpCondition: (paths: Path[], n: number) => {
        return ([, { fp, k }]) => {
          if (fp < pMax) {
            return true;
          }
          return paths[k].snaked === 0 && fp < n;
        }
      },
      snakeLorR: ({ a, b, m, n }: Source) => {
        return (k: number, y1: number) => {
          const [x, y] = recurse<[number, number]>(
            ([x, y]) => x < m && y < n && a[x] === b[y],
            ([x, y]) => [x + 1, y + 1]
          )([y1 - k, y1]);
          return [x, y, y];
        }
      }
    }
  },
  "R": (pMax: number): SnakeLorR => {
    return {
      onpCondition: () => {
        return ([, { fp }]) => fp < pMax;
      },
      snakeLorR: ({ a, b, m, n }: Source) => {
        return (k: number, y1: number) => {
          const [x, y] = recurse<[number, number]>(
            ([x, y]) => x < m && y < n && a[m - x - 1] === b[n - y - 1],
            ([x, y]) => [x + 1, y + 1]
          )([y1, y1 - k]);
          return [x, y, x];
        }
      }
    }
  }
}

function snakeOnp(offset: number, fp: Fpk[], paths: Path[], snake: Snake) {
  return (k: number): void => {
    const [p, pp] = [fp[k - 1 + offset].fp + 1, fp[k + 1 + offset].fp];
    const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
    const [x, y, fpValue] = snake(k, y1);
    fp[k + offset] = { "fp": fpValue, "k": paths.length };
    const parent = paths[fp[k + dir + offset].k];
    paths.push({ x, y, snaked: y - y1, parent });
  }
}

export function Onp(source: Source, offset: number, delta: number, rangeKN: number[], rangeKM: number[]) {
  return ({ snakeLorR, onpCondition }: SnakeLorR): Path => {
    const { m, n } = source;
    const paths: Path[] = [];
    const fpk: Fpk[] = new Array(m + n + 3).fill({ "fp": - 1, "k": - 1 });
    const snake = snakeOnp(offset, fpk, paths, snakeLorR(source));
    const [, { k }] = recurse<[number, Fpk]>(
      onpCondition(paths, n),
      ([p]) => {
        rangeKN.slice(n - p).forEach(snake);
        rangeKM.slice(m - p + delta).forEach(snake);
        return [p + 1, fpk[delta + offset]];
      }
    )([delta, { "fp": - 1, "k": - 1 }]);
    return paths[k];
  }
}

/**
 * Diff main
 */

export function diff(a: string | string[], b: string | string[]) {
  const source = init({ a, b });
  const { m, n, nL, nR } = source;
  const offset = m + 1;
  const delta = n - m;

  const rangeKN = [...Array(n)].map((_, i) => - (n - i) + delta);
  const rangeKM = [...Array(m + 1)].map((_, i) => m - i + delta);

  threads.config.set({
    basepath : {
      node : __dirname,
      web  : 'http://myserver.local/thread-scripts'
    }
  });

  return new Promise(resolve => {
    const thOnp = threads.spawn('thOnp.js');
    const promiseOnp = thOnp.send(['R', nR, { source, delta, offset, rangeKN, rangeKM }]).promise();
    const headL = Onp(source, offset, delta, rangeKN, rangeKM)(Snakes['L'](nL));
    promiseOnp.then(headR => {
      const newHeadR = getHeadR(source, headL, headR);
      if (!newHeadR || (headL.x >= m && headL.y >= n)) {
        const resultL = unifiedResult(unifieds.L(source))(headL, []);
        resolve(resultL);
      } else {
        const thResult = threads.spawn('thResult.js');
        const promiseResult = thResult.send(['R', source, newHeadR]).promise();
        const resultL = unifiedResult(unifieds.L(source))(headL, []);
        promiseResult.then(resultR => {
          resolve(([] as Ses[]).concat(...resultL, ...resultR));
          thResult.kill();
        });
      }
      thOnp.kill();
    });
  });
}
