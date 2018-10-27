'use strict';

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
      while (next = next[parentKey]) yield next;
    }
  }];
}

type Source = {
  a: string | string[],
  b: string | string[],
  m: number,
  n: number,
  flip: boolean
};

type KList = {
  "k": number,
  "fp": number
}[];

type Path = {
  x: number,
  y: number,
  parent: Path
};

type Ses = {
  value: string,
  added: boolean,
  removed: boolean,
  common: boolean
};

function init({ a, b }: { a: string | string[], b: string | string[] }): Source {
  const [m, n] = [a.length, b.length];
  function orFlip({ a, b }): Source {
    if (m >= n) {
      return { "a": b, "b": a, "m": n, "n": m, "flip": true };
    }
    return { a, b, m, n, "flip": false };
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return orFlip({ a, b });
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return orFlip({ a, b });
  }
  return orFlip({ a: String(a), b: String(b) });
};

function unifiedResult({ a, b, flip }: Source, head: Path) {
  function getUndiff(x, undiffs): [Ses?] {
    if (undiffs > 0) {
      return [{ "value": a.slice(x - undiffs, x) as string, "added": false, "removed": false, "common": true }];
    }
    return [];
  }
  function getDiff(diffs: number, { x, y }): [Ses?] {
    if (diffs > 0) {
      return [{ "value": a[x] as string, "added": flip, "removed": !flip, "common": false }];
    }
    if (diffs < 0) {
      return [{ "value": b[y] as string, "added": !flip, "removed": flip, "common": false }];
    }
    return [];
  }
  const pathList = linkedListToArray(head, 'parent');
  return pathList.reduceRight((acc: Ses[], { x, y, parent = { x: 0, y: 0 } }) => {
    const diffX = x - parent.x;
    const diffY = y - parent.y;
    const ses = [...getDiff(diffX - diffY, parent), ...getUndiff(x, Math.min(diffX, diffY))] as [Ses, Ses?];
    const last = acc[acc.length - 1];
    const next = ses[0];
    if (last && ((last.added && next.added) || (last.removed && next.removed))) {
      return [...acc.slice(0, -1), { "value": last.value + next.value, "added": last.added, "removed": last.removed }, ...ses.slice(1)] as Ses[];
    }
    return [...acc, ...ses] as Ses[];
  }, [] as Ses[]);
}

function Snake({ a, b, m, n }: Source) {
  return ([k, p, pp]): [number, number, number, number] => {
    const [y1, dir] = p > pp ? [p, -1] : [pp, 1];
    const [x, y] = recurse<[number, number]>(
        ([x, y]) => (x < m && y < n && a[x] === b[y]),
        ([x, y]) => [x + 1, y + 1]
      )([y1 - k, y1]);
    return [k, dir, x, y];
  }
};

export function diff(a: string | string[], b: string | string[]) {
  const source = init({ a, b });
  const { m, n } = source;
  const offset = m + 1;
  const delta = n - m;
  const kListMax = m + n + 3;
  const snake = Snake(source);
  const pathList: Path[] = [];
  const kList: KList = new Array(kListMax).fill({ "k": - 1, "fp": - 1 });

  function getFP([k]): [number, number, number] {
    return [k, kList[k - 1 + offset].fp + 1, kList[k + 1 + offset].fp];
  }

  function setPath([k, dir, x, y]) {
    kList[k + offset] = { "k": pathList.length, "fp": y };
    const parent = pathList[kList[k + dir + offset].k];
    pathList.push({ x, y, parent });
  }

  recurse<[number, number]>(
    ([fp]) => fp !== n,
    ([, p]) => {
      ([
        [- p      , ([k]) => k < delta  ,   1],
        [delta + p, ([k]) => k > delta  , - 1],
        [delta    , ([k]) => k === delta, - 1]
      ] as [number, { (args: any[]): boolean }, number][])
      .forEach(([init, condition, addK]) => {
        recurse(condition, pipe(getFP, snake, tap(setPath), ([k]) => [k + addK]))(getFP([init]));
      });
      return [kList[delta + offset].fp, p + 1];
    }
  )([0, 0]);

  // console.log(JSON.stringify(pathList, null, 4)); // See all paths.
  const head = pathList[kList[delta + offset].k];
  return unifiedResult(source, head);
}
