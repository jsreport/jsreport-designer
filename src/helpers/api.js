import superagent from 'superagent'
import Promise from 'bluebird'
import parse from './parseJSON.js'
import resolveUrl from './resolveUrl'
import { apiHeaders } from '../lib/configuration.js'

const methods = ['get', 'post', 'put', 'patch', 'del']

let requestHandler = {}

const createError = (err, body) => {
  try {
    let parsed = JSON.parse(body)
    body = parsed
  } catch (e) {

  }

  if (body && body.error) {
    let e = new Error(body.error.message)
    e.stack = body.error.stack
    return e
  }

  if (body && body.message) {
    let e = new Error(body.message)
    e.stack = body.stack
    return e
  }

  if (body && typeof body === 'string') {
    return new Error(body.substring(0, 1000) + '...')
  }

  return err || new Error('API call failed')
}

methods.forEach((m) => {
  requestHandler[m] = (path, { params, data, attach, parseJSON, responseType } = {}) => new Promise((resolve, reject) => {
    const request = superagent[m](resolveUrl(path))

    Object.keys(apiHeaders).forEach((k) => request.set(k, apiHeaders[k]))
    request.set('X-Requested-With', 'XMLHttpRequest')
    request.set('Expires', '-1')
    request.set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1,private')

    if (params) {
      request.query(params)
    }

    if (responseType) {
      request.responseType(responseType)
    }

    if (attach) {
      request.attach(attach.filename, attach.file)
    }

    if (data) {
      request.send(data)
    }

    request.end((err, res) => {
      if (err) {
        return reject(createError(err, res ? res.text : null))
      }

      if (parseJSON === false) {
        resolve(res.text)
      }

      if (responseType) {
        resolve(res.xhr.response)
      }

      resolve(parse(res.text))
    })
  })
})


let stubHandler = {}
methods.forEach((m) => {
  stubHandler[m] = (stub) => (requestHandler[m] = stub)
})

export default requestHandler

export { methods }

export let stub = stubHandler
