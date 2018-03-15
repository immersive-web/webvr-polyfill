/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const cleanup = require('rollup-plugin-cleanup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const json = require('rollup-plugin-json');
const banner = fs.readFileSync(path.join(__dirname, 'licenses.txt'));

export default {
  input: 'src/index.js',
  output: {
    file: './build/webvr-polyfill.js',
    format: 'umd',
    name: 'WebVRPolyfill',
  },
  watch: {
    include: 'src/**',
  },
  banner: banner,
  plugins: [
    // Need to use json() since webvr-polyfill-dpdb
    // just exposes a JSON file
    json(),
    babel({
      plugins: ['external-helpers'],
      exclude: 'node_modules/**',
    }),
    resolve(),
    commonjs({
      include: ['src/**', 'node_modules/**'],
    }),
    cleanup(),
  ],
};
