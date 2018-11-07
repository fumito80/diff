'use strict';

/**
 * Common Function
 */

const tap = f => a => { f(a); return a; };
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
  function unified(pathList) {
    return pathList.reduceRight((acc: Ses[], { x, y, parent = { x: 0, y: 0 } }) => {
      const diffX = x - parent.x;
      const diffY = y - parent.y;
      const undiff = getUndiff(x, Math.min(diffX, diffY));
      const diffOrNull = getDiff(diffX - diffY, parent);
      const [last] = acc.slice(- 1);
      const [diff] = diffOrNull;
      if (diff && last && ((last.added && diff.added) || (last.removed && diff.removed))) {
        return [...acc.slice(0, -1), Object.assign({}, last, { "value": last.value + diff.value }), ...undiff];
      }
      return [...acc, ...diffOrNull, ...undiff];
    }, []);
  }
  const pathList = linkedListToArray(head, 'parent');
  return unified(pathList);
}

/**
 * Diff main
 */

export function diff(a: string | string[], b: string | string[]) {
  const source = init({ a, b });
  const { m, n, nb } = source;
  const offset = m + 1;
  const delta = n - m;
  const kListMax = m + n + 3;
  const pathList: Path[] = [];
  const kLogs: { "k": number, "fp": number }[] = new Array(kListMax).fill({ "k": - 1, "fp": - 1 });

  const rangesMinusK = [...Array(n)].map((_, i) => - (n - i) + delta);
  const rangesPlusK  = [...Array(m + 1)].map((_, i) => m - i + delta);

  function Snake({ a, b, m, n }: Source) {
    return (k: number): [number, number, number, number] => {
      const [p, pp] = [kLogs[k - 1 + offset].fp + 1, kLogs[k + 1 + offset].fp];
      const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
      const [x, y] = recurse<[number, number]>(
          ([x, y]) => (x < m && y < n && a[x] === b[y]),
          ([x, y]) => [x + 1, y + 1]
        )([y1 - k, y1]);
      return [k, dir, x, y];
    }
  };

  function setPath([k, dir, x, y]) {
    kLogs[k + offset] = { "k": pathList.length, "fp": y };
    const parent = pathList[kLogs[k + dir + offset].k];
    pathList.push({ x, y, parent });
  }

  function onp(n: number): Path {
    const snake = Snake(source);
    const [, { k }] = recurse<[number, { "k": number, "fp": number }]>(
      ([, { fp }]) => fp < n,
      ([p]) => {
        const kList = [...rangesMinusK.slice(n - p), ...rangesPlusK.slice(m - p + delta)];
        kList.map(pipe(snake, tap(setPath)));
        return [p + 1, kLogs[delta + offset]];
      }
    )([delta, { "k": - 1, "fp": - 1 }]);
    return pathList[k];
  }

  const head = onp(n);
  // console.log(JSON.stringify(pathList, null, 4)); // See all paths.
  return unifiedResult(source, head);
}
