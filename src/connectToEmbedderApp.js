import Promise from 'bluebird'
import postRobot from 'post-robot'
import { getParent } from 'cross-domain-utils'

class EmbedderApp {
  constructor ({ window, domain }) {
    this.window = window
    this.domain = domain
  }

  initialize () {
    // designer is embedded, we need to setup some listener and sender
    // for communication with the embedder app
    let listener
    let sender

    listener = postRobot.listener({
      window: this.window,
      domain: this.domain
    })

    sender = postRobot.client({
      window: this.window,
      domain: this.domain
    })

    this.listener = listener
    this.sender = sender

    return new Promise ((resolve) => {
      listener.on('ready', (ev) => {
        resolve(ev.data)
      })
    })
  }
}

export default () => {
  let parentWindow = getParent(window)
  let parentWindowDomain = window.location.search !== '' ? window.location.search.slice(1).split('&') : []

  parentWindowDomain = parentWindowDomain.reduce((result, param) => {
    let parsedParam = param.split('=');
    result[parsedParam[0]] = decodeURIComponent(parsedParam[1]);
    return result;
  }, {}).originDomain;

  // only create embedder instance if we have origin domain and window present
  if (parentWindow != null && parentWindowDomain != null && parentWindowDomain !== '') {
    return new EmbedderApp({
      window: parentWindow,
      domain: parentWindowDomain
    })
  }

  return undefined
}
