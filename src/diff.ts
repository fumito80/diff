'use strict';

const tap = f => a => { f(a); return a; };
const pipe = (fn, ...fns) => (arg) => fns.reduce((acc, fn2) => fn2(acc), fn(arg));
function recurse<T>(cbCondition: { (a: T): boolean }, cbRecurse: { (a: T): T }) {
  function run(arg: T): T {
    if (!cbCondition(arg)) {
      return arg;
    }
    return run(cbRecurse(arg));
  }
  return run;
}

enum DiffType {
  DELETE = -1,
  COMMON =  0,
  ADD    =  1
}

type Ses = { elem: string, t: DiffType }[];
type Epc = [number, number]; // x, y
// type PathPos = [number, number, number]; // x, y, k
type PathList = {
  x: number,
  y: number,
  parent: PathList
};
type Source = {
  "a": string | string[],
  "b": string | string[],
  "m": number,
  "n": number,
  "flip": boolean
};

function init(_a: string | string[], _b: string | string[]): Source {
  const [m, n] = [_a.length, _b.length];
  function ret(a, b): Source {
    if (m >= n) {
      return { "a": b, "b": a, "m": n, "n": m, "flip": true };
    }
    return { a, b, m, n, "flip": false };
  }
  if (typeof _a === 'string' && typeof _b === 'string') {
    return ret(_a, _b);
  }
  if (Array.isArray(_a) && Array.isArray(_b)) {
    return ret(_a, _b);
  }
  return ret(String(_a), String(_b));
};

function recordseq(epc: Epc[], a: string | string[], b: string | string[], reverse: boolean): Ses {
  function selectPath(diffYX: number) {
    return ([px, py]: [number, number]) => {
      if (diffYX === py - px) {
        return [a[px], DiffType.COMMON, px + 1, py + 1];
      }
      if (diffYX > py - px) {
        return [b[py], reverse ? DiffType.DELETE : DiffType.ADD, px, py + 1];
      }
      // if (y - x < py - px)
      return [a[px], reverse ? DiffType.ADD : DiffType.DELETE, px + 1, py];
    }
  }
  const ses: Ses = [];
  epc.reduce(([px, py], [x, y]) => {
    return recurse(
      ([px, py]) => (px < x || py < y),
      pipe(
        selectPath(y - x),
        ([elem, t, px, py]) => [px, py, ses.push({ elem, t })]
      )
    )([px, py]);
  }, [0, 0]);
  return ses;
};

function snake({ a, b, m, n }: Source) {
  return ([k, p, pp]): [number, number, number, number] => {
    const [y1, dir] = p > pp ? [p, DiffType.DELETE] : [pp, DiffType.ADD];
    const [x, y] = recurse<[number, number]>(
        ([x, y]) => (x < m && y < n && a[x] === b[y]),
        ([x, y]) => [x + 1, y + 1]
      )([y1 - k, y1]);
    return [k, dir, x, y];
  }
};

function diff2({ a, b }: Source, pathList: PathList): Ses {
  const ses: Ses = [];
  recurse<PathList>(
    ({ parent }) => parent != null,
    ({ x, y, parent }) => {
      const diffX = x - parent.x;
      const diffY = y - parent.y
      const sameLen = Math.min(diffX, diffY);

      if (sameLen > 0) {
        ses.unshift({ "elem": a.slice(x - sameLen, x) as string, "t": DiffType.COMMON });
      }
      if (diffY < diffX) {
          ses.unshift({ "elem": a[parent.x] as string, "t": DiffType.DELETE });
      } else if (diffX < diffY) {
        ses.unshift({ "elem": b[parent.y] as string, "t": DiffType.ADD });
      }

      return parent;
    }
  )(pathList);
  return ses;
}

export namespace Diff {
  export const { DELETE, COMMON, ADD } = DiffType;
  export function diff(str1: string | string[], str2: string | string[]) {
    const source = init(str1, str2);
    const offset = source.m + 1;
    const delta  = source.n - source.m;
    const size   = source.m + source.n + 3;
    const pathList: PathList[] = [];
    const epc: Epc[] = [];
    const path = new Array<{ "k": number, "fp": number }>(size).fill({ "k": -1, "fp": -1 });

    function setPath([k, dir, x, y]) {
      path[k + offset] = { "k": pathList.length, "fp": y };
      pathList.push({ x, y, parent: pathList[path[k + dir + offset].k] });
      // pathpos.push([x, y, path[k + dir + offset].k]);
    }

    recurse<number>(
      _ => (path[delta + offset].fp !== source.n),
      p => {
        ([
          [- p      , ([k]) => k < delta, ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp],   1],
          [delta + p, ([k]) => k > delta, ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp], - 1]
        ] as [number, { (args: any[]): boolean }, { (args: any[]): [number, number, number] }, number][])
        .forEach(([init, condition, fp, addK]) => {
          recurse(condition, pipe(fp, snake(source), tap(setPath), ([k]) => [k + addK]))(fp([init]));
        });
        pipe(snake(source), tap(setPath))
          ([delta, path[delta - 1 + offset].fp + 1, path[delta + 1 + offset].fp]);
        return p + 1;
      }
    )(0);

    // console.log(JSON.stringify(pathList[path[delta + offset].k], null, 4));
    return diff2(source, pathList[path[delta + offset].k]);
    // recurse(
    //   r => r !== -1,
    //   r => {
    //     const [x, y, k] = pathpos[r];
    //     epc.unshift([x, y]);
    //     return k;
    //   }
    // )(path[delta + offset].k);

    // console.log(JSON.stringify(epc, null, 4));
    // return recordseq(epc, a, b, reverse);
  }
}
