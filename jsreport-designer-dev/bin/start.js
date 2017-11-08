#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const yargs = require('yargs')

const argv = yargs.options({
  'run-only': {
    type: 'boolean',
    default: false
  }
}).argv

console.log('Checking if jsreport installed')

try {
  fs.statSync(path.join(process.cwd(), 'node_modules', 'jsreport'))
} catch (e) {
  console.log('Installing the latest jsreport, this takes few minutes')
  execSync('npm install jsreport --no-save', { stdio: [0, 1, 2] })
}

function tryRequire (module) {
  try {
    return fs.statSync(module)
  } catch (e) {
    return false
  }
}

function installDesigner (p) {
  console.log('Installing jsreport-designer dev dependencies at ' + p)
  return execSync('npm install', { stdio: [0, 1, 2], cwd: p })
}

function installDesignerIfRequired (p) {
  var packageJson
  try {
    packageJson = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8'))
  } catch (e) {
    return
  }

  for (var k in packageJson.devDependencies) {
    if (!tryRequire(path.join(p, 'node_modules', k))) {
      // somehow npm install failes on EBUSY error if this field is not deleted
      delete packageJson._requiredBy
      fs.writeFileSync(path.join(p, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf8')
      return installDesigner(p)
    }
  }
}

if (!argv.runOnly) {
  console.log('Making sure jsreport-designer has dev dependencies installed')
  installDesignerIfRequired(path.join(process.cwd(), 'node_modules', 'jsreport', 'node_modules', 'jsreport-designer'))
  installDesignerIfRequired(path.join(process.cwd(), 'node_modules', 'jsreport-designer'))
}

console.log('Starting ...')

if (!argv.runOnly) {
  // TODO: discuss about the possibility to unify jsreport-studio-dev and jsreport-designer-dev
  // in one CLI with separates packages? and use specific env var for
  // different projects (like JSREPORT_DESIGNER_DEV) and also add
  // JSREPORT_ENV as a source for reporter.options.mode

  // process.env.NODE_ENV = 'jsreport-development'
  // put jsreport designer in dev to compile dependencies in express middleware
  process.env.JSREPORT_DESIGNER_DEV = true
  // this configures babel-preset-react-app correctly for development
  process.env.BABEL_ENV = 'development'
}

const jsreport = require(path.join(process.cwd(), 'node_modules', 'jsreport'))

jsreport().init().catch(function (e) {
  console.error(e)
})
