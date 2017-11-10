
const path = require('path')
const webpack = require('webpack')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const getBabelPreset = require('./getBabelPreset')
const getStylesConfig = require('./getStyles')

const exposedLibraries = [
  'react',
  'react-dom',
  'superagent',
  'bluebird',
  'handlebars'
]

module.exports = {
  // Don't attempt to continue if there are any errors.
  bail: true,
  devtool: 'hidden-source-map',
  entry: {
    main: './designer/main_dev.js'
  },
  output: {
    // Add /* filename */ comments to generated require()s in the output.
    // UNCOMMENT THE NEXT LINE WHEN DEBUGGING THE BUNDLE
    // pathinfo: true,
    filename: './designer/main.js',
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info => {
      return path.relative(process.cwd(), info.absoluteResourcePath).replace(/\\/g, '/')
    }
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx']
  },
  resolveLoader: {
    // This allows you to set a fallback for where Webpack should look for loader modules.
    // first we look in designer dev package modules,
    // and then fallback to normal node modules resolution
    modules: [path.join(__dirname, '../node_modules'), 'node_modules']
  },
  externals: [
    function (context, request, callback) {
      if (/babel-runtime/.test(request)) {
        return callback(null, 'Designer.runtime[\'' + request.substring('babel-runtime/'.length) + '\']')
      }

      if (exposedLibraries.indexOf(request) > -1) {
        return callback(null, 'Designer.libraries[\'' + request + '\']')
      }

      if (request === 'jsreport-designer') {
        return callback(null, 'Designer')
      }

      callback()
    }
  ],
  module: {
    // importing a nonexistent named export would fail to compile
    strictExportPresence: true,
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          // using our prepared preset
          presets: [getBabelPreset()],
          // COMMENT NEXT-LINE WHEN DEBUGGING THE BUNDLE
          compact: true
        }
      },
      {
        // styles by default are local (css modules)
        // except for styles inside theme folder
        test: /\.css$/,
        exclude: [/.*theme.*/],
        use: getStylesConfig({ modulesEnabled: true })
      },
      {
        // styles inside theme folder are global
        test: /\.css$/,
        include: [/.*theme.*\.css/],
        use: getStylesConfig()
      },
      {
        // sass styles by default are local (css modules)
        // except for styles inside theme folder
        test: /\.scss$/,
        exclude: [/.*theme.*/],
        use: getStylesConfig({ modulesEnabled: true, processor: 'sass' })
      },
      {
        // sass styles inside theme folder are global
        test: /\.scss$/,
        include: [/.*theme.*\.scss/],
        use: getStylesConfig({ processor: 'sass' })
      },
      {
        test: /\.less$/,
        use: getStylesConfig({ modulesEnabled: true, processor: 'less' })
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff'
        }
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: 'url-loader',
        options: {
          limit: 8192
        }
      }
    ]
  },
  plugins: [
    // Makes some environment variables available to the JS code, for example:
    // if (process.env.NODE_ENV === 'production') { ... }
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      },
      __DEVELOPMENT__: false
    }),
    // Watcher doesn't work well if you mistype casing in a path so we use
    // a plugin that prints an error when you attempt to do this.
    new CaseSensitivePathsPlugin(),
    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    // ignore dev config
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/, /\.\/dev/, /\/config$/),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        // Disabled because of an issue with Uglify breaking seemingly valid code:
        // https://github.com/facebookincubator/create-react-app/issues/2376
        // Pending further investigation:
        // https://github.com/mishoo/UglifyJS2/issues/2011
        comparisons: false,
      },
      output: {
        comments: false,
        // Turned on because emoji and regex is not minified properly using default
        // https://github.com/facebookincubator/create-react-app/issues/2488
        ascii_only: true,
      },
      sourceMap: true
    })
  ],
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },
  // Turn off performance hints during development because we don't do any
  // splitting or minification in interest of speed. These warnings become
  // cumbersome.
  performance: {
    hints: false
  }
}
