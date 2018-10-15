'use strict';

import * as R from 'ramda';
import { Maybe, $, F, domContentLoaded } from './common/util';
import codeMirror from 'codemirror';

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
  return Object.assign(document.createElement('span'), { textContent, className });
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

domContentLoaded()
  .addListener('.form', 'submit', ev => {
    sources.forEach(src => {
      const cm = ($(src.code).nextElementSibling as any).CodeMirror as CodeMirror.EditorFromTextArea;
      Maybe.fromNullable(cm.getValue() || null)
        .map(R.tryCatch(JSON.parse, jsonParseErr(src.code)))
        .map(R.curry(JSON.stringify)(R.__, null, 4))
        .map(result => cm.setValue(result));
    });
    ev.preventDefault();
    return false;
  })
  .ready(_ => {
    sources.forEach(src => {
      const cm = codeMirror.fromTextArea($<HTMLTextAreaElement>(src.code), {
        lineNumbers: true,
        mode: "application/ld+json"
      });
    });
  });
