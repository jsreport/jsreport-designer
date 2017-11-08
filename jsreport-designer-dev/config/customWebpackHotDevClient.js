/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/**
 * NOTE: this file was taken from CRA:
 * https://github.com/facebookincubator/create-react-app/blob/e62bfdd7ce7fb9f305e0f0591d2c63c535189eb2/packages/react-dev-utils/webpackHotDevClient.js
 *
 * we had to fork it in order to make it work with webpack-hot-middleware
 * with the following changes:
 *  - ErrorOverlay.startReportingRuntimeErrors filename option set to our bundle filename "client.js"
 *  - added a Connection
 *  - connection to server is using EventSource instead of sockjs
 *  - events received by webpack-hot-middleware are different than
 *    event received when using CRA (webpack dev server) so we apply
 *    conditions to the events messages received to match the same behaviour
 */

// This alternative WebpackDevServer combines the functionality of:
// https://github.com/webpack/webpack-dev-server/blob/webpack-1/client/index.js
// https://github.com/webpack/webpack/blob/webpack-1/hot/dev-server.js

// It only supports their simplest configuration (hot updates on same server).
// It makes some opinionated choices on top, like adding a syntax error overlay
// that looks similar to our console output. The error overlay is inspired by:
// https://github.com/glenjamin/webpack-hot-middleware

// var SockJS = require('sockjs-client');
var stripAnsi = require('strip-ansi');
var url = require('url');
var launchEditorEndpoint = require('react-dev-utils/launchEditorEndpoint');
var formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
var ErrorOverlay = require('react-error-overlay');

// most of the code is this class was taken from the webpack-hot-middleware/client
// https://github.com/glenjamin/webpack-hot-middleware/blob/5d3e2eeadded5980f26fa7f744d5f8b08fb2c89c/client.js
function Connection (options) {
  var source;
  var lastActivity = new Date();
  var listeners = [];
  var closeListeners = [];

  if (typeof window === 'undefined') {
  // do nothing
  } else if (typeof window.EventSource === 'undefined') {
    console.warn(
      "webpack hot client requires EventSource to work. " +
      "You should include a polyfill if you want to support this browser: " +
      "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events#Tools"
    );
  }

  init();

  var timer = setInterval(function() {
    if ((new Date() - lastActivity) > options.timeout) {
      handleDisconnect();
    }
  }, options.timeout / 2);

  function init() {
    source = new window.EventSource(options.path);
    source.onopen = handleOnline;
    source.onerror = handleDisconnect;
    source.onmessage = handleMessage;
  }

  function handleOnline() {
    if (options.log) console.log("[HMR] connected");
    lastActivity = new Date();
  }

  function handleMessage(event) {
    lastActivity = new Date();
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](event);
    }
  }

  function handleDisconnect() {
    clearInterval(timer);
    source.close();

    for (var i = 0; i < closeListeners.length; i++) {
      closeListeners[i]();
    }

    // disabling reconnection
    // setTimeout(init, options.timeout);
  }

  return {
    addMessageListener: function(fn) {
      listeners.push(fn);
    },
    addCloseListener: function (fn) {
      closeListeners.push(fn);
    }
  };
}

ErrorOverlay.setEditorHandler(function editorHandler(errorLocation) {
  // Keep this sync with errorOverlayMiddleware.js
  fetch(
    launchEditorEndpoint +
      '?fileName=' +
      window.encodeURIComponent(errorLocation.fileName) +
      '&lineNumber=' +
      window.encodeURIComponent(errorLocation.lineNumber || 1)
  );
});

// We need to keep track of if there has been a runtime error.
// Essentially, we cannot guarantee application state was not corrupted by the
// runtime error. To prevent confusing behavior, we forcibly reload the entire
// application. This is handled below when we are notified of a compile (code
// change).
// See https://github.com/facebookincubator/create-react-app/issues/3096
var hadRuntimeError = false;
ErrorOverlay.startReportingRuntimeErrors({
  onError: function() {
    hadRuntimeError = true;
  },
  filename: 'client.js' // '/static/js/bundle.js',
});

if (module.hot && typeof module.hot.dispose === 'function') {
  module.hot.dispose(function() {
    // TODO: why do we need this?
    ErrorOverlay.stopReportingRuntimeErrors();
  });
}

// Connect to Webpack Hot Middleware endpoint
var connection = new Connection({
  // __root_path__ is var defined in designer's webpack entry file "publicPath"
  path: __root_path__ + '/__webpack_hmr',
  timeout: 20 * 1000,
  log: true
})

// Connect to WebpackDevServer via a socket.
// var connection = new Connection(
//   url.format({
//     protocol: window.location.protocol,
//     hostname: window.location.hostname,
//     port: window.location.port,
//     // Hardcoded in WebpackDevServer
//     pathname: '/sockjs-node',
//   })
// );

// Unlike WebpackDevServer client, we won't try to reconnect
// to avoid spamming the console. Disconnect usually happens
// when developer stops the server.
connection.addCloseListener(function () {
  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info(
      'The development server has disconnected.\nRefresh the page if necessary.'
    );
  }
})

// connection.onclose = function() {
//   if (typeof console !== 'undefined' && typeof console.info === 'function') {
//     console.info(
//       'The development server has disconnected.\nRefresh the page if necessary.'
//     );
//   }
// };

// Remember some state related to hot module replacement.
var isFirstCompilation = true;
var mostRecentCompilationHash = null;
var hasCompileErrors = false;

function clearOutdatedErrors() {
  // Clean up outdated compile errors, if any.
  if (typeof console !== 'undefined' && typeof console.clear === 'function') {
    if (hasCompileErrors) {
      console.clear();
    }
  }
}

// Successful compilation.
function handleSuccess() {
  clearOutdatedErrors();

  var isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates(function onHotUpdateSuccess() {
      // Only dismiss it when we're sure it's a hot update.
      // Otherwise it would flicker right before the reload.
      ErrorOverlay.dismissBuildError();
    });
  }
}

// Compilation with warnings (e.g. ESLint).
function handleWarnings(warnings) {
  clearOutdatedErrors();

  var isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  function printWarnings() {
    // Print warnings to the console.
    var formatted = formatWebpackMessages({
      warnings: warnings,
      errors: [],
    });

    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      for (var i = 0; i < formatted.warnings.length; i++) {
        if (i === 5) {
          console.warn(
            'There were more warnings in other files.\n' +
              'You can find a complete log in the terminal.'
          );
          break;
        }
        console.warn(stripAnsi(formatted.warnings[i]));
      }
    }
  }

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates(function onSuccessfulHotUpdate() {
      // Only print warnings if we aren't refreshing the page.
      // Otherwise they'll disappear right away anyway.
      printWarnings();
      // Only dismiss it when we're sure it's a hot update.
      // Otherwise it would flicker right before the reload.
      ErrorOverlay.dismissBuildError();
    });
  } else {
    // Print initial warnings immediately.
    printWarnings();
  }
}

// Compilation with errors (e.g. syntax error or missing modules).
function handleErrors(errors) {
  clearOutdatedErrors();

  isFirstCompilation = false;
  hasCompileErrors = true;

  // "Massage" webpack messages.
  var formatted = formatWebpackMessages({
    errors: errors,
    warnings: [],
  });

  // Only show the first error.
  ErrorOverlay.reportBuildError(formatted.errors[0]);

  // Also log them to the console.
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    for (var i = 0; i < formatted.errors.length; i++) {
      console.error(stripAnsi(formatted.errors[i]));
    }
  }

  // Do not attempt to reload now.
  // We will reload on next success instead.
}

// There is a newer version of the code available.
function handleAvailableHash(hash) {
  // Update last known compilation hash.
  mostRecentCompilationHash = hash;
}

// Handle messages from the server.
connection.addMessageListener(function (e) {
  if (event.data == '\uD83D\uDC93') {
    return
  }

  var message

  try {
    var message = JSON.parse(e.data);
  } catch (ex) {
    return console.warn("Invalid HMR message: " + event.data + "\n" + ex);
  }

  switch (message.action) {
    case 'building':
      console.log(
        "[HMR] bundle " + (message.name ? "'" + message.name + "' " : "") +
        "rebuilding"
      );

      break;
    case 'built':
    case 'sync':
      if (message.action === 'built') {
        console.log(
          "[HMR] bundle " + (message.name ? "'" + message.name + "' " : "") +
          "rebuilt in " + message.time + "ms"
        );
      }

      // no way to generate a still-ok when using webpack dev middleware

      // hash
      handleAvailableHash(message.hash)

      // no "content-changed" when using webpack dev middleware

      if (message.errors.length > 0) {
        // errors
        handleErrors(message.errors);
      } else if (message.warnings.length > 0) {
        // warnings
        handleWarnings(message.warnings);
      } else {
        // ok
        handleSuccess();
      }

      break;
    default:
      return;
  }
})

// connection.onmessage = function(e) {
//   var message = JSON.parse(e.data);
//   switch (message.type) {
//     case 'hash':
//       handleAvailableHash(message.data);
//       break;
//     case 'still-ok':
//     case 'ok':
//       handleSuccess();
//       break;
//     case 'content-changed':
//       // Triggered when a file from `contentBase` changed.
//       window.location.reload();
//       break;
//     case 'warnings':
//       handleWarnings(message.data);
//       break;
//     case 'errors':
//       handleErrors(message.data);
//       break;
//     default:
//     // Do nothing.
//   }
// };

// Is there a newer version of this code available?
function isUpdateAvailable() {
  /* globals __webpack_hash__ */
  // __webpack_hash__ is the hash of the current compilation.
  // It's a global variable injected by Webpack.
  return mostRecentCompilationHash !== __webpack_hash__;
}

// Webpack disallows updates in other states.
function canApplyUpdates() {
  return module.hot.status() === 'idle';
}

// Attempt to update code on the fly, fall back to a hard reload.
function tryApplyUpdates(onHotUpdateSuccess) {
  if (!module.hot) {
    // HotModuleReplacementPlugin is not in Webpack configuration.
    window.location.reload();
    return;
  }

  if (!isUpdateAvailable() || !canApplyUpdates()) {
    return;
  }

  function handleApplyUpdates(err, updatedModules) {
    if (err || !updatedModules || hadRuntimeError) {
      window.location.reload();
      return;
    }

    if (typeof onHotUpdateSuccess === 'function') {
      // Maybe we want to do something.
      onHotUpdateSuccess();
    }

    if (isUpdateAvailable()) {
      // While we were updating, there was a new update! Do it again.
      tryApplyUpdates();
    }
  }

  // https://webpack.github.io/docs/hot-module-replacement.html#check
  var result = module.hot.check(/* autoApply */ true, handleApplyUpdates);

  // // Webpack 2 returns a Promise instead of invoking a callback
  if (result && result.then) {
    result.then(
      function(updatedModules) {
        handleApplyUpdates(null, updatedModules);
      },
      function(err) {
        handleApplyUpdates(err, null);
      }
    );
  }
}
