import gulp from 'gulp';
import webpack from 'webpack-stream';
import * as rollup from 'rollup';
import * as ts from 'gulp-typescript';
import path from 'path';
import fs from 'fs';

/**
 * tsc
 */
gulp.task('tsc-server-common', _ => {
  return gulp.src(['./src/common/*.ts'])
    .pipe(ts.createProject('tsconfig.json')())
    .pipe(gulp.dest('js/server/common'));
});
gulp.task('tsc-server', _ => {
  return gulp.src(['./src/server.ts'])
    .pipe(ts.createProject('tsconfig.json')())
    .pipe(gulp.dest('js/server'));
});
gulp.task('tsc-client-common', _ => {
  return gulp.src(['./src/common/*.ts'])
    .pipe(ts.createProject('tsconfig.json')())
    .pipe(gulp.dest('js/client/common'));
});
gulp.task('tsc-client', _ => {
  return gulp.src(['./src/client.ts'])
    .pipe(ts.createProject('tsconfig.json')())
    .pipe(gulp.dest('js/client'));
});

/**
 * webpack
 */
function webPack(name: string) {
  gulp
    .src([`./js/${name}/*.js`])
    .pipe(webpack(require(`./webpack.${name}.js`)))
    .pipe(gulp.dest('./dist'));
}

/**
 * ramda-build
 */
function getTsFiles(searchPath: string): string[] {
  return fs.readdirSync(searchPath).reduce((acc, fileName) => {
    const filePath = path.join(searchPath, fileName);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return acc.concat(getTsFiles(filePath));
    }
    if (stat.isFile() && fileName.endsWith('.ts')) {
      return acc.concat(filePath);
    }
    return acc;
  }, [] as string[]);
}

function getRamdaModMatch(re, text, result) {
  const [, moduleName] = re.exec(text) || [, null];
  if (moduleName) {
    return result.concat(moduleName, getRamdaModMatch(re, text, result));
  }
  return result;
}

function extractRamdaMod() {
  return getTsFiles(path.join(__dirname, 'src'))
    .reduce((acc, filePath) => {
      const text = fs.readFileSync(filePath).toString();
      const modules = getRamdaModMatch(/R\.(\w+)/g, text, []);
      return acc.concat(modules);
    }, [] as string[])
    .filter((value, i, self) => self.indexOf(value) === i);
}

function partialBuild(options) {
  const absoluteInput = path.join(__dirname, options.input);
  return {
    name: 'ramda-partial-build',
    transform: function(code, id) {
      if (id !== absoluteInput) {
        return;
      }
      return {
        code: options.modules.map(function(module) {
          return 'export { default as ' + module + " } from './" + module + "';";
        }).join('\n')
      };
    }
  };
}

gulp.task('ramda-build', done => {
  const rollupConfig = require('./rollup.config.js');
  const modules = extractRamdaMod();
  rollupConfig.output.banner += '//\n//  Modules: ' + modules.join(', ') + '\n';
  const partialBuildPlugin = partialBuild({
    input: rollupConfig.input,
    modules: extractRamdaMod()
  });

  rollupConfig.plugins.push(partialBuildPlugin);

  rollup.rollup(rollupConfig).then((bundle) => {
    bundle.write(Object.assign(rollupConfig.output, {file: './node_modules/ramda/dist/ramda.js'}));
    console.log('Build modules: ' + modules.join(', '));
    done();
  });
});

/**
 * build
 */
gulp.task('default', ['tsc-client', 'tsc-client-common', 'ramda-build'], _ => {
  webPack('client');
});

gulp.task('svr', ['tsc-server', 'tsc-server-common', 'ramda-build'], _ => {
  webPack('server');
});