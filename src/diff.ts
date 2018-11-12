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

const log = (...ss) => ss.forEach(s => console.log(JSON.stringify(s, null, 2)));

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

type Fpk = {
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

function getUnifiedResult(source: Source, headL: Path, headR: Path) {
  const unifiedResultL = new UnifiedResultL(source);
  
  const { m, n } = source;
  const [, resultL] = unifiedResultL.run(headL, []);
  const [head] = recurse<[Path?, Path?]>(
    ([, parent]) => !!parent && headL.x >= (m - parent.x - 1) && headL.y >= (n - parent.y - 1),
    ([pathR, parent]) => [pathR.parent, parent.parent.parent]
  )([headR, headR.parent]);
  if (!head) {
    return resultL;
  }
  const [, result] = new UnifiedResultR(source).run(head, resultL);
  return result;
}

abstract class UnifiedResult {
  constructor(protected source: Source) {
    this.a = source.a;
    this.b = source.b;
    this.m = source.m;
    this.n = source.n;
    this.flip = source.flip;
  }
  protected a: string | string[];
  protected b: string | string[];
  protected flip: boolean;
  protected m: number;
  protected n: number;
  abstract getUndiff(x: number, undiffs: number);
  abstract getDiff(diffs: number, parent: Path);
  abstract getAcc(ses: Ses[][]);
  makeElem(value: string, t: ElemType) {
    return { value, added: t === ElemType.added, removed: t === ElemType.removed, common: t === ElemType.common };
  }
  run(head: Path, preResult: Ses[]) {
    return recurse<[Path, Ses[]]>(
      ([{ x }]) => x > 0,
      ([{ x, y, parent = { x: 0, y: 0 } }, acc]) => {
        const diffX = x - parent.x;
        const diffY = y - parent.y;
        const undiffOrNull = this.getUndiff(x, Math.min(diffX, diffY));
        const diffOrNull = this.getDiff(diffX - diffY, parent);
        return [parent, this.getAcc([undiffOrNull, diffOrNull, [...undiffOrNull, ...diffOrNull], acc, acc])];
      }
    )([head, preResult]);
  }
}

class UnifiedResultL extends UnifiedResult {
  getAcc([undiffOrNull, diffOrNull, [diff], [prev, ...tail], acc]: Ses[][]): Ses[] {
    if (prev && ((prev.added && diff.added) || (prev.removed && diff.removed))) {
      return [Object.assign({}, prev, { "value": diff.value + prev.value }), ...tail];
    }
    return [...diffOrNull, ...undiffOrNull, ...acc];
  }
  getUndiff(x, undiffs): [Ses] | never[] {
    if (undiffs > 0) {
      return [this.makeElem(this.a.slice(x - undiffs, x) as string, ElemType.common)];
    }
    return [];
  }
  getDiff(diffs: number, { x, y }): [Ses] | never[] {
    if (diffs > 0) {
      return [this.makeElem(this.a[x], this.flip ? ElemType.added : ElemType.removed)];
    }
    if (diffs < 0) {
      return [this.makeElem(this.b[y], this.flip ? ElemType.removed : ElemType.added)];
    }
    return [];
  }
}

class UnifiedResultR extends UnifiedResult {
  getAcc([undiffOrNull, diffOrNull, [diff], acc]: Ses[][]): Ses[] {
    const [undiff] = undiffOrNull;
    const [prev] = acc.slice(- 1);
    const tail = acc.slice(0, - 1);
    if (prev.common && undiff && undiff.common) {
      return [...acc, ...diffOrNull];
    }
    if ((prev.added && diff.added) || (prev.removed && diff.removed)) {
      return [...tail, Object.assign({}, prev, { "value": prev.value + diff.value })];
    }
    return [...acc, ...undiffOrNull, ...diffOrNull];
  }
  getUndiff(x, undiffs): [Ses] | never[] {
    if (undiffs > 0) {
      return [this.makeElem(this.a.slice(this.m - x, this.m - x + undiffs) as string, ElemType.common)];
    }
    return [];
  }
  getDiff(diffs: number, { x, y }): [Ses] | never[] {
    if (diffs > 0) {
      return [this.makeElem(this.a[this.m - x - 1], this.flip ? ElemType.added : ElemType.removed)];
    }
    if (diffs < 0) {
      return [this.makeElem(this.b[this.n - y - 1], this.flip ? ElemType.removed : ElemType.added)];
    }
    return [];
  }
}

const snakeConditionL: SnakeCondition = ({ a, b, m, n }) => ([x, y]) => x < m && y < n && a[x] === b[y];
const snakeConditionR: SnakeCondition = ({ a, b, m, n }) => ([x, y]) => x < m && y < n && a[m - x - 1] === b[n - y - 1];

function Snake(offset: number, fp: Fpk[], paths: Path[], condition: {([x, y]: [number, number]): boolean }) {
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
    const fpk: Fpk[] = new Array(m + nMax + 3).fill({ "fp": - 1, "k": - 1 });
    const snake = Snake(offset, fpk, paths, snakeCondition(source));
    const [, { k }] = recurse<[number, Fpk]>(
      ([, { fp }]) => fp < nMax,
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

  const onp = Onp(source, offset, delta, rangeKN, rangeKM);

  const headL = onp(nL, snakeConditionL);
  const headR = onp(nR + 3, snakeConditionR);
  // log(headL, headR);
  return getUnifiedResult(source, headL, headR);
}
