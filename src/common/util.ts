export class F {
  static pipe<T>(fn: { (a: T): T }, ...fns: { (a: T): T }[]) {
    return (arg: T) => fns.reduce((acc, fn2) => fn2(acc), fn(arg));
  }
  // static compose<T>(...fns: { (a: T): T }[]) {
  //   return F.pipe(fns.pop() as { (a: T): T }, fns.reverse();
  // }
  static pipeP(fn: { (any): Promise<any> }, ...fns: { (any): Promise<any> }[]) {
    return (arg) => fns.reduce((acc: Promise<any>, fn2) => acc.then(fn2), fn(arg));
  }
}

/**
 * Maybe monad
 */
export class Maybe {
  public static just = (a) => new Just(a);
  public static nothing = () => new Nothing();
  public static fromNullable = (a): IMaybe => (a != null) ? Maybe.just(a) : Maybe.nothing();
  public static of = (a) => Maybe.just(a);
}

export interface IMaybe {
  value;
  map(f);
  getOrElse(_);
  filter(f);
  chain(f);
}

class Just extends Maybe implements IMaybe {
  constructor(private valueIn) {
    super();
  }
  get value() {
    return this.valueIn;
  }
  public map = (f) => Maybe.fromNullable(f(this.value));
  public getOrElse = (_) => this.value;
  public filter = (f) => Maybe.fromNullable(f(this.value) ? this.value : null);
  public chain = (f) => f(this.value);
}

class Nothing extends Maybe implements IMaybe {
  get value() {
    throw new TypeError(`Can't extract the value of a Nothing.`);
  }
  public map = (_) => this;
  public getOrElse = (other) => other;
  public filter = (_) => this;
  public chain = (_) => this;
}

export function $(selector: string, el: Element = document as any) {
  return el.querySelector(selector) as HTMLElement;
}

export function setListenerOnCompleetDom() {
  const promise = new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', resolve);
  });
  return function(selector: string, type: string, listener: EventListener) {
    promise.then(_ => $(selector).addEventListener(type, listener));
  }
}
