'use strict';

/**
 * Common Functions
 */

const pipe = <T>(fn, ...fns) => (arg): T => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

function recurse<T>(cbCondition: { (a: T): boolean }, cbRecurse: { (a: T): T }) {
  function run(arg: T): T {
    if (cbCondition(arg)) {
      return run(cbRecurse(arg));
    }
    return arg;
  }
  return run;
}

function linkedListToArray<T>(head: T, parentKey: string) {
  let next = Object.assign({}, head, { [parentKey]: head }) as T;
  return [...{
    *[Symbol.iterator]() {
      while (next = next[parentKey]) {
        yield next;
      }
    }
  }];
}

/**
 * Types
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

type Path = {
  "x": number,
  "y": number,
  "parent"?: Path
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

type SnakeCondition = { (s: Source): { ([x, y]: [number, number]): boolean } };

enum ElemType { added, removed, common };

/**
 * Flip args(text) by length.
 */

function init({ a = '', b = '' }: { a: string | string[], b: string | string[] }): Source {
  const [m, n] = [a.length, b.length];
  function split({ a, b, m, n, flip }: Source): Source {
    const nL = Math.ceil(n / 2);
    const nR = Math.trunc(n / 2);
    return { a, b, m, n, nL, nR, flip };
  }
  function orFlip({ a, b }): Source {
    if (m >= n) {
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

function unifiedResultR({ a, b, m, n, flip }: Source, head: Path) {
  function makeElem(value: string, t: ElemType) {
    return { value, added: t === ElemType.added, removed: t === ElemType.removed, common: t === ElemType.common };
  }
  function getUndiff(x, undiffs): [Ses] | never[] {
    if (undiffs > 0) {
      return [makeElem(a.slice(m - x, m - x + undiffs) as string, ElemType.common)];
    }
    return [];
  }
  function getDiff(diffs: number, { x, y }): [Ses] | never[] {
    if (diffs > 0) {
      return [makeElem(a[m - x - 1], flip ? ElemType.added : ElemType.removed)];
    }
    if (diffs < 0) {
      return [makeElem(b[n - y - 1], flip ? ElemType.removed : ElemType.added)];
    }
    return [];
  }
  function getAcc([undiff, diffOrNull, [diff], acc]: Ses[][]): Ses[] {
    const [prev] = acc.slice(- 1);
    const tail = acc.slice(0, - 1);
    if (prev && ((prev.added && diff.added) || (prev.removed && diff.removed))) {
      return [...tail, Object.assign({}, prev, { "value": prev.value + diff.value })];
    }
    return [...acc, ...undiff, ...diffOrNull];
  }
  const [, result] = recurse<[Path, Ses[]]>(
    ([{ x }]) => x > 0,
    ([{ x, y, parent = { x: 0, y: 0 } }, acc]) => {
      const diffX = x - parent.x;
      const diffY = y - parent.y;
      const undiff = getUndiff(x, Math.min(diffX, diffY));
      const diffOrNull = getDiff(diffX - diffY, parent);
      return [parent, getAcc([undiff, diffOrNull, [...undiff, ...diffOrNull], acc])];
    }
  )([head, []]);
  return result;
//   function getAcc([undiff, diffOrNull, [diff], [prev, ...tail], acc]: Ses[][]): Ses[] {
//     if (prev && ((prev.added && diff.added) || (prev.removed && diff.removed))) {
//       return [Object.assign({}, prev, { "value": diff.value + prev.value }), ...tail];
//     }
//     return [...undiff, ...diffOrNull, ...acc];
//   }
//   function unified(pathList, reduceFun, nextFun) {
//     return reduceFun.call(pathList, (acc: Ses[], { x, y, parent = { x: 0, y: 0 } }) => {
//       const diffX = x - parent.x;
//       const diffY = y - parent.y;
//       const undiff = getUndiff(x, Math.min(diffX, diffY));
//       const diffOrNull = getDiff(diffX - diffY, parent);
//       return getAcc([undiff, diffOrNull, [...undiff, ...diffOrNull], acc, acc]);
//     }, [] as Ses[]);
//  }
//  const pathList = linkedListToArray(head, 'parent');
//  return unified(pathList, Array.prototype.reduceRight, (diff, undiff) => [...diff, ...undiff]);
}

/**
 * Snake
 */
// function Snake(condition: {([x, y]: [number, number]): boolean }) {
//   return ([k, dir, x, y]: number[]): number[] => {
//     const [xx, yy] = recurse<[number, number]>(
//         condition,
//         ([xx, yy]) => [xx + 1, yy + 1]
//       )([x, y]);
//     return [k, dir, xx, yy];
//   }
// };

const snakeConditionL: SnakeCondition = ({ a, b, m, n }) => ([x, y]) => x < m && y < n && a[x] === b[y];
const snakeConditionR: SnakeCondition = ({ a, b, m, n }) => ([x, y]) => x < m && y < n && a[m - x - 1] === b[n - y - 1];

function Snake(offset: number, fp: Fp[], paths: Path[], condition: {([x, y]: [number, number]): boolean }) {
  return (k: number) => {
    const [p, pp] = [fp[k - 1 + offset].fp + 1, fp[k + 1 + offset].fp];
    const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
    const [x, y] = recurse<[number, number]>(
      condition,
      ([x, y]) => [x + 1, y + 1]
    )([y1 - k, y1]);
    fp[k + offset] = { "fp": y, "k": paths.length };
    const parent = paths[fp[k + dir + offset].k];
    paths.push({ x, y, parent });
  }
};

function Onp(source: Source, offset: number, delta: number, rangeKN: number[], rangeKM: number[]) {
  return (nMax: number, snakeCondition: SnakeCondition): Path => {
    const { m, n } = source;
    const paths: Path[] = [];
    const fp: Fp[] = new Array(m + nMax + 3).fill({ "fp": - 1, "k": - 1 });
    const snake = Snake(offset, fp, paths, snakeCondition(source));
    const [, { k }] = recurse<[number, Fp]>(
      ([, { fp }]) => fp < nMax,
      ([p]) => {
        rangeKN.slice(n - p).forEach(snake);
        rangeKM.slice(m - p + delta).forEach(snake);
        return [p + 1, fp[delta + offset]];
      }
    )([delta, { "fp": - 1, "k": - 1 }]);
    return paths[k];
  }
}

const log = (...ss) => ss.forEach(s => console.log(JSON.stringify(s, null, 2)));

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

  const onp = Onp(source, offset, delta, rangeKN, rangeKM);

  const headL = onp(nL, snakeConditionL);
  const headR = onp(nR, snakeConditionR);
  log(headL, headR);
  return [...unifiedResult(source, headL), ...unifiedResultR(source, headR)];
  // return unifiedResultR(source, headR);
}
