'use strict';

const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  target: 'node',
  externals: [nodeExternals()],
  output: {
    filename: 'server.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.js']
  }
};
