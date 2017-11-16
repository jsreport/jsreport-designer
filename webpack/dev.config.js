
const path = require('path')
const designerDev = require('jsreport-designer-dev')
const getBabelPreset = designerDev.getBabelPreset
const getStylesConfig = designerDev.getStylesConfig
const assetsPath = path.resolve(__dirname, '../static/dist')

const {
  webpack,
  webpackHotDevClientPath,
  HtmlWebpackPlugin,
  CaseSensitivePathsPlugin,
  WatchMissingNodeModulesPlugin
} = designerDev.deps

module.exports = (appDir, extensions, componentTypes) => {
  return {
    // this shows original source files as is in devtools.
    // set 'eval' instead if you prefer to see the compiled output in DevTools.
    devtool: 'cheap-module-source-map',
    // an absolute path, for resolving entry points and loaders from configuration
    context: path.resolve(__dirname, '..'),
    entry: {
      main: [
        // add some polyfills
        './src/polyfill.js',
        // configure webpack publich path
        './src/publicPath.js',
        // Include an alternative client for dev-middleware. A client's job is to
        // connect to dev-middleware by a socket and get notified about changes.
        // When you save a file, the client will either apply hot updates (in case
        // of CSS changes), or refresh the page (in case of JS changes). When you
        // make a syntax error, this client will display a syntax error overlay.
        // Note: we use a custom client to bring better experience.
        webpackHotDevClientPath,
        // load font-awesome based on configuration
        'font-awesome-webpack!./src/theme/font-awesome.config.js',
        // Finally, the designer entry point code
        './src/client.js',
        // We include the app code last so that if there is a runtime error during
        // initialization, it doesn't blow up the webpack entry client, and
        // changing JS code would still trigger a refresh.
      ]
    },
    output: {
      path: assetsPath,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: true,
      filename: 'client.js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: '[name].chunk.js',
      // we are not setting "publicPath" (base url path of the assets of designer)
      // here on purpose, we are setting the "publicPath" dynamically (based on main url of designer)
      // in our entry point (src/client.js).

      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
    },
    resolve: {
      // This allows you to set a fallback for where Webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      modules: ['node_modules', path.join(__dirname, '../node_modules')],
      extensions: ['.json', '.js', '.jsx'],
      alias: {
        // use browser build of handlebars
        handlebars: 'handlebars/dist/handlebars.min.js'
      }
    },
    resolveLoader: {
      // This allows you to set a fallback for where Webpack should look for loader modules.
      // first we look in designer dev local loaders, then designer dev loaders in node modules,
      // and then fallback to normal node modules resolution
      modules: [path.join(designerDev.dirname, 'loaders'), path.join(designerDev.dirname, 'node_modules'), 'node_modules']
    },
    externals: [
      // we expose Designer API as 'jsreport-designer' for extensions
      (context, request, callback) => {
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
          // we process components entry points separately because we want
          // to run a custom loader that add HMR to component files
          include: [/index.designer\.(js|jsx)$/],
          use: [
            {
              loader: 'accept-component-definition-hmr-loader',
              options: {
                // registered components
                componentTypes
              }
            },
            {
              loader: 'babel-loader',
              options: {
                // using our prepared preset
                presets: [getBabelPreset(true)],
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true
              }
            }
          ]
        },
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          exclude: (modulePath) => {
            const ignoreExtensionEntryPointRegExp = /index.designer\.(js|jsx)$/

            // ignore extension component entry points because they are handled in the above configuration
            if (ignoreExtensionEntryPointRegExp.test(modulePath)) {
              return true
            }

            for (let key in extensions) {
              let pathRelativeToExtension = modulePath.replace(extensions[key].directory, '')

              if (
                modulePath.indexOf(extensions[key].directory) !== -1 &&
                // this condition prevents collisions when an extensions like
                // "../jsreport-browser-client" is found but modulePath includes a file with a name
                // that contains the extension (like "../jsreport-browser-client-dist/"),
                // se we ensure that next character of relative path should be a path separator
                // to avoid this cases
                (pathRelativeToExtension[0] === '/' || pathRelativeToExtension[0] === '\\') &&
                pathRelativeToExtension.indexOf('node_modules') === -1
              ) {
                return false
              }
            }

            return true
          },
          options: {
            // using our prepared preset
            presets: [getBabelPreset(true)],
            // This is a feature of `babel-loader` for webpack (not Babel itself).
            // It enables caching results in ./node_modules/.cache/babel-loader/
            // directory for faster rebuilds.
            cacheDirectory: true
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
      // Add module names to factory functions so they appear in browser profiler.
      new webpack.NamedModulesPlugin(),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'development') { ... }
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('development')
        },
        __DEVELOPMENT__: true
      }),
      // This is necessary to emit hot updates
      new webpack.HotModuleReplacementPlugin(),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      new CaseSensitivePathsPlugin(),
      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      new WatchMissingNodeModulesPlugin(path.join(appDir, 'node_modules')),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        hash: true,
        inject: true,
        template: path.join(__dirname, '../static/index.html'),
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
}
