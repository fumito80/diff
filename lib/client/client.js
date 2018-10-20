'use strict';

var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  result["default"] = mod;
  return result;
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const R = __importStar(require("ramda"));

const util_1 = require("./common/util");

const codemirror_1 = __importDefault(require("codemirror"));

const jsonParseErr = src => _ => alert(src.substring(1).toUpperCase() + 'はJSONに変換できません');

const sources = [{
  code: ".json1",
  result: ".result1"
}, {
  code: ".json2",
  result: ".result2"
}];

function addNode(f, textContent, className) {
  return p => {
    if (textContent) {
      p.appendChild(f(textContent, className));
    }

    return p;
  };
}

function createSpan(textContent, className) {
  return Object.assign(document.createElement('span'), {
    textContent,
    className
  });
}

function createText(textContent, className) {
  return document.createTextNode(textContent);
}

function craeteLine(line) {
  const [, sl, key, sm, value, sr] = /^(\{|\s+|\})(".+?")?(:\s\{?\[?)?(.*?)(\}?\]?,?|,)?$/.exec(line) || [...['']];
  return util_1.F.pipe(addNode(createText, sl), addNode(createSpan, key, 'key'), addNode(createText, sm), addNode(createSpan, value, 'value'), addNode(createText, sr))(document.createElement('p'));
}

util_1.domContentLoaded().addListener('.form', 'submit', ev => {
  sources.forEach(src => {
    const cm = util_1.$(src.code).nextElementSibling.CodeMirror;
    util_1.Maybe.fromNullable(cm.getValue() || null).map(R.tryCatch(JSON.parse, jsonParseErr(src.code))).map(R.curry(JSON.stringify)(R.__, null, 4)).map(result => cm.setValue(result));
  });
  ev.preventDefault();
  return false;
}).ready(_ => {
  sources.forEach(src => {
    const cm = codemirror_1.default.fromTextArea(util_1.$(src.code), {
      lineNumbers: true,
      mode: "application/ld+json"
    });
  });
});