'use strict';

import * as R from 'ramda';
import { Maybe, $, F, setListenerOnCompleetDom } from './common/util';

const addListener = setListenerOnCompleetDom();

const jsonParseErr = (src: string) => _ => alert(src.substring(1).toUpperCase() + 'はJSONに変換できません');

const sources = [
  { code: ".json1", result: ".result1" },
  { code: ".json2", result: ".result2" }
];

type fnCreateEl = { (textContent: string, className?: string): HTMLSpanElement | Text };

function addNode(f: fnCreateEl, textContent: string, className?: string) {
  return (p: HTMLParagraphElement) => {
    if (textContent) {
      p.appendChild(f(textContent, className));
    }
    return p;
  }
}

function createSpan(textContent: string, className?: string) {
  return Object.assign(document.createElement('span'), { textContent, className }) as HTMLSpanElement;
}

function createText(textContent: string, className?: string) {
  return document.createTextNode(textContent);
}

function craeteLine(line) {
  const [, sl, key, sm, value, sr] = /^(\{|\s+|\})(".+?")?(:\s\{?\[?)?(.*?)(\}?\]?,?|,)?$/.exec(line) || [...['']];
  return F.pipe(
    addNode(createText, sl),
    addNode(createSpan, key, 'key'),
    addNode(createText, sm),
    addNode(createSpan, value, 'value'),
    addNode(createText, sr),
  )(document.createElement('p'));
}

addListener('.form', 'submit', ev => {
  sources.forEach(src => {
    $(src.result).innerHTML = '';
    Maybe.fromNullable(($(src.code) as HTMLTextAreaElement).value || null)
      .map(R.tryCatch(JSON.parse, jsonParseErr(src.code)))
      .map(R.curry(JSON.stringify)(R.__, null, 4))
      .map(R.split('\n'))
      .map(R.map(craeteLine))
      .map(R.map($(src.result).appendChild as { (a: HTMLElement): HTMLElement }));
  });
  ev.preventDefault();
  return false;
});
