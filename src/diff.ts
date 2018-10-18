'use strict';

enum DiffType {
  DELETE = -1,
  COMMON = 0,
  ADD    = 1
}

type PathPosi = { x: number, y: number, k: number };
type Ses = { elem: string, t: DiffType }[];

function init(a: string, b: string): [string, string, number, number, boolean] {
  const m = a.length;
  const n = b.length;
  if (m >= n) {
    return [b, a, n, m, true];
  }
  return [a, b, m, n, false];
};

const P = (x: number, y: number, k: number): PathPosi => ({ x, y, k });

function snake(k, p, pp, a, b, m, n, path, offset, pathpos) {
  
  function incXY(x: number, y: number): [number, number] {
    if (!(x < m && y < n && a[x] === b[y])) {
      return [x, y];
    }
    return incXY(x + 1, y + 1);
  }

  const dir = p > pp ? DiffType.DELETE : DiffType.ADD;
  const r = path[k + dir + offset];
  const y1 = Math.max(p, pp);
  const [x, y] = incXY(y1 - k, y1);

  path[k + offset] = pathpos.length;
  pathpos[pathpos.length] = P(x, y, r);
  return y;
};

const pipe = (fn: any, ...fns: any[]) => (arg: any) => fns.reduce((acc, fn2) => fn2(acc), fn(arg));

function recordseq(epc: PathPosi[], a: string, b: string, reverse: boolean) {
  function selctPath([ses, px, py, idx]) {
    if (epc[idx].y - epc[idx].x > py - px) {
      return [ses, b[py], reverse ? DiffType.DELETE : DiffType.ADD, px, py + 1];
    } else if (epc[idx].y - epc[idx].x < py - px) {
      return [ses, a[px], reverse ? DiffType.ADD : DiffType.DELETE, px + 1, py];
    }
    return [ses, a[px], DiffType.COMMON, px + 1, py + 1];
  }

  const buildSes = ([ses, elem, t, px, py]) => [([] as Ses).concat(ses, { elem, t }), px, py];

  function calcSes(idx: number) {
    return ([ses, px, py]) => {
      if (!(px < epc[idx].x || py < epc[idx].y)) {
        return [ses, px, py];
      }
      return pipe(selctPath, buildSes, calcSes(idx))([ses, px, py, idx]);
    }
  }

  function decEpc(idx: number) {
    return ([ses, px, py]: [Ses, number, number]) => {
      if (idx < 0) {
        return ses as Ses;
      }
      return pipe(calcSes(idx), decEpc(idx - 1))([ses, px, py]) as Ses;
    }
  }

  return decEpc(epc.length - 1)([[] as Ses, 0, 0]);
};

export namespace Diff {
  export const { DELETE, COMMON, ADD } = DiffType;
  export function diff(str1: string, str2: string) {
    const [a, b, m, n, reverse] = init(str1, str2);
    const offset = m + 1;
    let path = {};
    let pathpos: PathPosi[] = [];
    const delta = n - m;
    const size  = m + n + 3;
    let fp = {};
    for (let i = 0; i < size; ++i) {
      fp[i] = -1;
      path[i] = -1;
    }
    let p = -1;
    do {
      ++p;
      for (let k = -p; k <= delta - 1; ++k) {
        fp[k+offset] = snake(k, fp[k-1+offset]+1, fp[k+1+offset], a, b, m, n, path, offset, pathpos);
      }
      for (let k= delta + p; k >= delta + 1; --k) {
        fp[k+offset] = snake(k, fp[k-1+offset]+1, fp[k+1+offset], a, b, m, n, path, offset, pathpos);
      }
      fp[delta+offset] = snake(delta, fp[delta-1+offset]+1, fp[delta+1+offset], a, b, m, n, path, offset, pathpos);
    } while (fp[delta+offset] !== n);
    
    let r = path[delta + offset];
    
    const epc: PathPosi[] = [];
    while (r !== -1) {
      epc.push(P(pathpos[r].x, pathpos[r].y, 0));
      r = pathpos[r].k;
    }
    return recordseq(epc, a, b, reverse);
  }
}
