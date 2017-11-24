
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (
    module.exports = factory()
  ) : typeof define === 'function' && define.amd ? (
    define(factory)
  ) : global.jsreportDesigner = factory()
}(this, function factory () {
  'use strict';
  var postRobot = window.postRobot
  var crossDomainUtils = window.crossDomainUtils

  function onDesignerWindowLoad (designerInstanceLoaded, cb) {
    var callback = typeof cb === 'function' ? cb : function () {}

    var windowComunnication = initializeDesignerWindowCommunication(
      designerInstanceLoaded.window,
      designerInstanceLoaded.url
    )

    designerInstanceLoaded.listener = windowComunnication.listener
    designerInstanceLoaded.sender = windowComunnication.sender

    setupDesignerWindowListeners(designerInstanceLoaded)

    designerInstanceLoaded.sender.send('ready', {
      design: designerInstanceLoaded.options.design,
      sampleData: designerInstanceLoaded.options.sampleData,
      utils: designerInstanceLoaded.options.utils
    }).then(function () {
      callback(null)
    }).catch(callback)
  }

  function initializeDesignerWindowCommunication (targetWindow, targetUrl) {
    var targetWindowDomain = crossDomainUtils.getDomainFromUrl(targetUrl)

    // setting up secure channels for communication between the
    // external app window and the designer window
    var listener = postRobot.listener({
      window: targetWindow,
      domain: targetWindowDomain
    });

    var sender = postRobot.client({
      window: targetWindow,
      domain: targetWindowDomain
    });

    return {
      listener: listener,
      sender: sender
    }
  }

  function setupDesignerWindowListeners (designerInstance) {
    var listener = designerInstance.listener

    // NOTE: register listener events here
  }

  // yeah, old school javascript class :D
  function Designer () {
    // contains properties about designer opened in target
    // and the listener chanel
    this.designerInstance = undefined
  }

  Designer.prototype.open = function (targetEl, options, cb) {
    var iframeEl = document.createElement('iframe')
    var frameName = 'jsreport-designer'
    var url = options.url
    var targetDesignerInstance
    var windowComunnication

    if (this.designerInstance) {
      // TODO: destroy previous designerInstance here (cancel listeners)
    }

    if (url.slice(-1) !== '/') {
      url += '/'
    }

    // pass to designer the origin domain
    url += '?originDomain=' + encodeURIComponent(crossDomainUtils.getDomain(window))

    iframeEl.src = url
    iframeEl.frameBorder = '0'
    iframeEl.name = Math.random().toString() + '_' + frameName.replace(/[^a-zA-Z0-9]+/g, '_')
    iframeEl.style.width = '100%'
    iframeEl.style.height = '100%'

    // ensuring that element is empty
    targetEl.innerHTML = ''

    iframeEl.onload = function () {
      onDesignerWindowLoad.apply(
        undefined,
        [targetDesignerInstance, cb]
      )
    };

    targetEl.appendChild(iframeEl)

    targetDesignerInstance = {
      window: iframeEl.contentWindow,
      loadedUrl: url,
      url: options.url,
      options: Object.assign({}, options)
    }

    this.designerInstance = targetDesignerInstance
  }

  return new Designer()
}))
