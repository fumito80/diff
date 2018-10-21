'use strict';

const I = a => a;
const pipe = (fn, ...fns) => (arg) => fns.reduce((acc, fn2) => fn2(acc), fn(arg));
function recurse(comparator, fn, post = I) {
  function run(arg) {
    if (!comparator(arg)) {
      return post(arg);
    }
    return run(fn(arg));
  }
  return run;
}

enum DiffType {
  DELETE = -1,
  COMMON =  0,
  ADD    =  1
}

type Ses = { elem: string, t: DiffType }[];
type PathPos = { "x": number, "y": number };
type PathPosWithK = { "xy": PathPos, "k": number };
type InitResult = [string | string[], string | string[], number, number, boolean];

function init(a: string | string[], b: string | string[]): InitResult {
  function retInit(_a, _b): InitResult {
    const [m, n] = [_a.length, _b.length];
    if (m >= n) {
      return [_b, _a, n, m, true];
    }
    return [_a, _b, m, n, false];
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return retInit(a, b);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return retInit(a, b);
  }
  return retInit(String(a), String(b));
};

function recordseq(epc: PathPos[], a: string | string[], b: string | string[], reverse: boolean): Ses {
  function selctPath([idx, ses, px, py]) {
    if (epc[idx].y - epc[idx].x > py - px) {
      return [idx, ses, b[py], reverse ? DiffType.DELETE : DiffType.ADD, px, py + 1];
    }
    if (epc[idx].y - epc[idx].x < py - px) {
      return [idx, ses, a[px], reverse ? DiffType.ADD : DiffType.DELETE, px + 1, py];
    }
    return [idx, ses, a[px], DiffType.COMMON, px + 1, py + 1];
  }
  return recurse(
    ([idx]) => idx >= 0,
    recurse(
      ([idx, , px, py]) => (px < epc[idx].x || py < epc[idx].y),
      pipe(
        selctPath,
        ([idx, ses, elem, t, px, py]) => [idx, ([] as Ses).concat(ses, { elem, t }), px, py]
      ),
      ([idx, ses, px, py]) => [idx - 1, ses, px, py]
    ),
    ([, ses]) => ses
  )([epc.length - 1, [] as Ses, 0, 0]);
};

function snake(a, b, m, n, path, offset) {
  return ([k, p, pp]): [number, PathPosWithK] => {
    const [y1, dir] = p > pp ? [p, DiffType.DELETE] : [pp, DiffType.ADD];
    const [x, y] = recurse(
        ([x, y]) => (x < m && y < n && a[x] === b[y]),
        ([x, y]) => [x + 1, y + 1]
      )([y1 - k, y1]);
    return [k, { "xy": { x, y }, "k": path[k + dir + offset].row}];
  }
};

export namespace Diff {
  export const { DELETE, COMMON, ADD } = DiffType;
  export function diff(str1: string | string[], str2: string | string[]) {
    const [a, b, m, n, reverse] = init(str1, str2);
    const offset = m + 1;
    const delta  = n - m;
    const size   = m + n + 3;
    const pathpos: PathPosWithK[] = [];
    const path = Array<{ "row": number, "fp": number }>(size).fill({ "row": -1, "fp": -1 });

    function setPath([k, p]: [number, PathPosWithK]) {
      path[k + offset] = { "row": pathpos.length, "fp": p.xy.y };
      pathpos.push(p);
      return k;
    }

    recurse(
      _ => (path[delta + offset].fp !== n),
      counter => {
        ([
          [- counter      , ([k]) => k < delta  , ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp]        , k => [k + 1]],
          [delta + counter, ([k]) => k > delta  , ([k]) => [k, path[k - 1 + offset].fp + 1, path[k + 1 + offset].fp]        , k => [k - 1]],
          [delta          , ([k]) => k === delta, ([k]) => [k, path[delta - 1 + offset].fp + 1, path[delta + 1 + offset].fp], k => [k + 1]]
        ] as [number, { (args: any[]): boolean }, { (args: any[]): [number, number, number] }, { (arg: number): [number] }][])
        .map(([init, comparator, fp, nextK]) => {
          recurse(comparator, pipe(fp, snake(a, b, m, n, path, offset), setPath, nextK))(fp([init]));
        });
        return counter + 1;
      }
    )(-1);

    const [epc]: [PathPos[]] = recurse(
      ([, r]) => r !== -1,
      ([epc, r]) => [epc.concat(pathpos[r].xy), pathpos[r].k]
    )([[], path[delta + offset].row]);

    return recordseq(epc, a, b, reverse);
  }
}
