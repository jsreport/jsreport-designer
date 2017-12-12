import Promise from 'bluebird'

export default function () {
  // eslint-disable-next-line no-undef
  if (__DEVELOPMENT__) {
    require('../extensions_dev.js')
    return Promise.resolve()
  }

  // "extensions" is the chunkname for our full extensions bundle.
  // (the "webpackChunkName" comment has a special meaning for webpack)
  // this name is also used in designer's webpack middleware that produce the bundle
  // so if you change the chunkname for some reason don't forget to update it in the
  // middleware too
  return import(
    /* webpackChunkName: "extensions" */
    '../extensions.js'
  )
}
