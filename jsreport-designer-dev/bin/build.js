#!/usr/bin/env node

const path = require('path')
const yargs = require('yargs')

const argv = yargs.options({
  config: {
    type: 'string',
    requiresArg: true
  },
  'disable-chunks-info': {
    type: 'boolean'
  },
  cwd: {
    type: 'string'
  }
}).argv

let config

// this configures babel-preset-react-app correctly for production
process.env.BABEL_ENV = 'production'

// custom working directory
if (argv.cwd) {
  process.chdir(path.resolve(process.cwd(), argv.cwd))
}

console.log(`building at cwd: ${process.cwd()}`)

const createCompiler = require('../createCompiler')

if (argv.config) {
  let configPath = path.resolve(process.cwd(), argv.config)
  console.log('using custom webpack config at:', configPath)

  try {
    config = require(configPath)
  } catch (e) {
    throw new Error('Error while trying to use config in ' + configPath + ' : ' + e.message)
  }
} else {
  // default config
  config = require('../config/extensionProd.config')
}

createCompiler(config, (err, stats) => {
  if (err) {
    console.error(err)
    return process.exit(1)
  }

  var jsonStats = stats.toJson()

  if (jsonStats.errors.length > 0) {
    console.error(jsonStats.errors)
    process.exit(1)
  }

  console.log(stats.toString({
    colors: true,
    modules: argv.disableChunksInfo !== true,
    chunks: argv.disableChunksInfo !== true,
    reasons: argv.disableChunksInfo !== true,
    chunkModules: false,
    cached: false
  }))

  console.log('webpack build  ok')
  console.log('\n')
}, false)
