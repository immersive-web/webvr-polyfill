const fs = require('fs');
const path = require('path');

const webpack = require('webpack');

// Integration with Google licensing requires specific formatting,
// hence this function rather than using BannerPlugin's
// default comment wrapper.
function generateBanner() {
  const licensePath = path.join(__dirname, 'LICENSE.md');
  const license = fs.readFileSync(licensePath, 'utf8')
                    .split('\n')
                    .map(line => ` * ${line}`)
                    .join('\n');

  return `/**\n * @license\n${license}\n */\n`;
}

module.exports = {
  entry: {
    'webvr-polyfill': './src/main.js',
    'webvr-polyfill.min': './src/main.js',
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js',
    sourceMapFilename: '[name].js.map',
  },
  resolve: {
    extensions: ['.js', '.js', '.json'],
  },
  devtool: 'source-map',
  devServer: {
    publicPath: '/build',
    contentBase: [
      path.resolve(__dirname, 'build'),
      path.resolve(__dirname, 'examples'),
    ],
    host: '0.0.0.0',
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
    }),
    new webpack.BannerPlugin({ banner: generateBanner(), raw: true }),
  ],
};
