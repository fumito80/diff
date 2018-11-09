'use strict';

/**
 * Common Functions
 */

function recurse<T>(cbCondition: { (a: T): boolean }, cbRecurse: { (a: T): T }) {
  function run(arg: T): T {
    if (cbCondition(arg)) {
      return run(cbRecurse(arg));
    }
    return arg;
  }
  return run;
}

/**
 * Types
 */

type Source = {
  "a": string | string[],
  "b": string | string[],
  "m": number,
  "n": number,
  "na"?: number,
  "nb"?: number,
  "flip": boolean
};

type Path = {
  "x": number,
  "y": number,
  "r": number
};

type Fp = {
  "fp": number,
  "k": number
};

type Ses = {
  "value": string,
  "added": boolean,
  "removed": boolean,
  "common": boolean
};

enum ElemType { added, removed, common };

/**
 * Initialize
 */

function init({ a = '', b = '' }: { a: string | string[], b: string | string[] }): Source {
  const [m, n] = [a.length, b.length];
  function split({ a, b, m, n, flip }: Source): Source {
    const na = Math.ceil(n / 2);
    const nb = Math.trunc(n / 2);
    return { a, b, m, n, na, nb, flip };
  }
  function orFlip({ a, b }): Source {
    if (m >= n) {
      return split({ "a": b, "b": a, "m": n, "n": m, "flip": true });
    }
    return split({ a, b, m, n, "flip": false });
  }
  if ((typeof a === 'string' && typeof b === 'string') || (Array.isArray(a) && Array.isArray(b))) {
    return orFlip({ a, b });
  }
  return orFlip({ a: String(a), b: String(b) });
};

/**
 * Format result
 */

function unifiedResult({ a, b, flip }: Source, paths: Path[], k: number) {
  function makeElem(value: string, t: ElemType) {
    return { value, added: t === ElemType.added, removed: t === ElemType.removed, common: t === ElemType.common };
  }
  function getUndiff(x, undiffs): [Ses] | never[] {
    if (undiffs > 0) {
      return [makeElem(a.slice(x - undiffs, x) as string, ElemType.common)];
    }
    return [];
  }
  function getDiff(diffs: number, { x, y }): [Ses] | never[] {
    if (diffs > 0) {
      return [makeElem(a[x], flip ? ElemType.added : ElemType.removed)];
    }
    if (diffs < 0) {
      return [makeElem(b[y], flip ? ElemType.removed : ElemType.added)];
    }
    return [];
  }
  function getAcc([undiff, diffOrNull, [diff], [prev, ...tail], acc]: Ses[][]): Ses[] {
    if (prev && ((prev.added && diff.added) || (prev.removed && diff.removed))) {
      return [Object.assign({}, prev, { "value": diff.value + prev.value }), ...tail];
    }
    return [...diffOrNull, ...undiff, ...acc];
  }
  const [, result] = recurse<[Path, Ses[]]>(
    ([path]) => !!path,
    ([{ x, y, r }, acc]) => {
      const parent = paths[r] || { x: 0, y: 0 };
      const diffX = x - parent.x;
      const diffY = y - parent.y;
      const undiff = getUndiff(x, Math.min(diffX, diffY));
      const diffOrNull = getDiff(diffX - diffY, parent);
      return [paths[r], getAcc([undiff, diffOrNull, [...undiff, ...diffOrNull], acc, acc])];
    }
  )([paths[k], []]);
  return result;
}

function getPaths(source, delta, offset, fpMax): [Path[], number] {
  function Snake({ a, b, m, n }: Source) {
    return (k: number, i: number): Path => {
      const [p, pp] = [fp[k - 1 + offset].fp + 1, fp[k + 1 + offset].fp];
      const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
      const [x, y] = recurse<[number, number]>(
          ([x, y]) => (x < m && y < n && a[x] === b[y]),
          ([x, y]) => [x + 1, y + 1]
        )([y1 - k, y1]);
      fp[k + offset] = { "fp": y, "k": i };
      return { x, y, r: fp[k + dir + offset].k }
    }
  };
  const fp: Fp[] = new Array(fpMax).fill({ "fp": - 1, "k": - 1 });
  const snake = Snake(source);
  let p = delta;
  let i = 0;
  return [[...{
    *[Symbol.iterator](): IterableIterator<Path> {
      while (fp[delta + offset].fp < source.n) {
        for (let k = - p; k < delta; k++) {
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

export function diff(a: string | string[], b: string | string[]) {
  const source = init({ a, b });
  const { m, n, nb } = source;
  const offset = m + 1;
  const delta = n - m;
  const fpMax = m + n + 3;
  const [paths, k] = getPaths(source, delta, offset, fpMax);
  return unifiedResult(source, paths, k);
}
