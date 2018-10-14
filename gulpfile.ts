import gulp from 'gulp';
import webpack from 'webpack-stream';
import * as rollup from 'rollup';
import * as ts from 'gulp-typescript';
import path from 'path';

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
gulp.task('ramda-build', done => {
  const rollupConfig = require('./rollup.config.js');
  const partialBuildPlugin = partialBuild({
    input: rollupConfig.input,
    modules: require('./ramdaModules.json')
  });

  rollupConfig.plugins.push(partialBuildPlugin);

  rollup.rollup(rollupConfig).then((bundle) => {
    bundle.write(Object.assign(rollupConfig.output, {file: './node_modules/ramda/dist/ramda.js'}));
    done();
  });

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
});

/**
 * build
 */
gulp.task('default', ['tsc-client', 'tsc-client-common'], _ => {
  webPack('client');
});

gulp.task('svr', ['tsc-server', 'tsc-server-common'], _ => {
  webPack('server');
});
