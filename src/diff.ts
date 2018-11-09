'use strict';

/**
 * Common Functions
 */

const pipe = (fn, ...fns) => (arg) => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

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
  "parent"?: Path
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

function unifiedResult({ a, b, flip }: Source, head: Path) {
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
    ([{ x }]) => x > 0,
    ([{ x, y, parent = { x: 0, y: 0 } }, acc]) => {
      const diffX = x - parent.x;
      const diffY = y - parent.y;
      const undiff = getUndiff(x, Math.min(diffX, diffY));
      const diffOrNull = getDiff(diffX - diffY, parent);
      return [parent, getAcc([undiff, diffOrNull, [...undiff, ...diffOrNull], acc, acc])];
    }
  )([head, []]);
  return result;
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
  const paths: Path[] = [];
  const fp: { "fp": number, "k": number }[] = new Array(fpMax).fill({ "fp": - 1, "k": - 1 });
  const snake = pipe(Snake(source), setPath);

  const rangesMinusK = [...Array(n)].map((_, i) => - (n - i) + delta);
  const rangesPlusK  = [...Array(m + 1)].map((_, i) => m - i + delta);

  function Snake({ a, b, m, n }: Source) {
    return (k: number): number[] => {
      const [p, pp] = [fp[k - 1 + offset].fp + 1, fp[k + 1 + offset].fp];
      const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
      const [x, y] = recurse<[number, number]>(
          ([x, y]) => (x < m && y < n && a[x] === b[y]),
          ([x, y]) => [x + 1, y + 1]
        )([y1 - k, y1]);
      return [k, dir, x, y];
    }
  };

  function setPath([k, dir, x, y]): void {
    fp[k + offset] = { "fp": y, "k": paths.length };
    const parent = paths[fp[k + dir + offset].k];
    paths.push({ x, y, parent });
  }

  function onp(n: number): Path {
    const [, { k }] = recurse<[number, { "fp": number, "k": number }]>(
      ([, { fp }]) => fp < n,
      ([p]) => {
        rangesMinusK.slice(n - p).forEach(snake);
        rangesPlusK.slice(m - p + delta).forEach(snake);
        return [p + 1, fp[delta + offset]];
      }
    )([delta, { "fp": - 1, "k": - 1 }]);
    return paths[k];
  }

  const head = onp(n);
  return unifiedResult(source, head);
}
