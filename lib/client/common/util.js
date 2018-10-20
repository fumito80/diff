"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class F {
  static pipe(fn, ...fns) {
    return arg => fns.reduce((acc, fn2) => fn2(acc), fn(arg));
  } // static compose<T>(...fns: { (a: T): T }[]) {
  //   return F.pipe(fns.pop() as { (a: T): T }, fns.reverse();
  // }


  static pipeP(fn, ...fns) {
    return arg => fns.reduce((acc, fn2) => acc.then(fn2), fn(arg));
  }

}

exports.F = F;
/**
 * Maybe monad
 */

class Maybe {}

Maybe.just = a => new Just(a);

Maybe.nothing = () => new Nothing();

Maybe.fromNullable = a => a != null ? Maybe.just(a) : Maybe.nothing();

Maybe.of = a => Maybe.just(a);

exports.Maybe = Maybe;

class Just extends Maybe {
  constructor(valueIn) {
    super();
    this.valueIn = valueIn;

    this.map = f => Maybe.fromNullable(f(this.value));

    this.getOrElse = _ => this.value;

    this.filter = f => Maybe.fromNullable(f(this.value) ? this.value : null);

    this.chain = f => f(this.value);
  }

  get value() {
    return this.valueIn;
  }

}

class Nothing extends Maybe {
  constructor() {
    super(...arguments);

    this.map = _ => this;

    this.getOrElse = other => other;

    this.filter = _ => this;

    this.chain = _ => this;
  }

  get value() {
    throw new TypeError(`Can't extract the value of a Nothing.`);
  }

}

function $(selector, el = document) {
  return el.querySelector(selector);
}

exports.$ = $;

function domContentLoaded() {
  const promise = new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', resolve);
  });
  const handler = {
    "addListener": function (selector, type, listener) {
      promise.then(_ => $(selector).addEventListener(type, listener));
      return handler;
    },
    "ready": function (f) {
      promise.then(f);
      return handler;
    }
  };
  return handler;
}

exports.domContentLoaded = domContentLoaded;