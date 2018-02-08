
const path = require('path')
const url = require('url')
const fs = require('fs')
const vm = require('vm')
const omit = require('lodash/omit')
const serveStatic = require('serve-static')
const favicon = require('serve-favicon')
const Promise = require('bluebird')
const generalStyles = require('../shared/generalStyles')
const readFileAsync = Promise.promisify(fs.readFile)

const DEFAULT_STYLE_PROP_NAME = 'style'

// TODO: prepare the file to support jsreport compilation
class Designer {
  constructor (reporter, definition, DEVELOPMENT) {
    this.reporter = reporter
    this.definition = definition
    this.componentTypes = {}
    this.mainStyles = []
    this.development = DEVELOPMENT

    reporter.options.tasks.modules.push({
      alias: 'handlebars',
      path: require.resolve('handlebars')
    })

    reporter.options.tasks.modules.push({
      alias: 'componentRegistry.js',
      path: path.join(__dirname, '../shared/componentRegistry')
    })

    reporter.options.tasks.modules.push({
      alias: 'evaluateScript.js',
      path: path.join(__dirname, '../shared/evaluateScript')
    })

    reporter.initializeListeners.add(definition.name, () => {
      // load general resources
      return this.loadDesignResources()
    })

    reporter.beforeRenderListeners.insert(
      { before: 'templates' },
      definition.name,
      this.renderDesign.bind(this)
    )
  }

  loadDesignResources () {
    return Promise.all([
      readFileAsync(path.join(__dirname, './static/designTemplate.hbs'), 'utf8'),
      readFileAsync(path.join(__dirname, './static/designHelpers.js'), 'utf8'),
      readFileAsync(path.join(__dirname, '../static/DesignElements.css'), 'utf8')
    ]).then((results) => {
      this.mainTemplate = results[0]
      this.mainHelpers = results[1]
      this.mainStyles = results[2]

      return {
        mainTemplate: this.mainTemplate,
        mainHelpers: this.mainHelpers,
        mainStyles: this.mainStyles
      }
    })
  }

  registerComponent (componentDefinition) {
    const reporter = this.reporter

    reporter.logger.debug(`Registering component ${componentDefinition.name} for designer`)

    const componentDefinitionToUse = normalizePropsMetaDef(componentDefinition)

    this.componentTypes[componentDefinitionToUse.name] = componentDefinitionToUse

    if (componentDefinitionToUse.modulePath) {
      // allowing importing component in jsreport helpers
      reporter.options.tasks.modules.push({
        alias: componentDefinitionToUse.modulePath,
        path: componentDefinitionToUse.modulePath
      })
    }
  }

  renderDesign (req, res) {
    let designPayload
    let designInputs
    let resolveResources

    if (!req.template || !req.template.design) {
      return
    }

    designPayload = req.template.design

    if (designPayload.canvas == null) {
      throw new Error('design payload needs "canvas" property, check the "design" object in "template" property of request body')
    }

    if (typeof designPayload.canvas !== 'object' || (typeof designPayload.canvas === 'object' && Array.isArray(designPayload.canvas))) {
      throw new Error('design payload needs "canvas" property to be an object, check the "design" object in "template" property of request body')
    }

    if (
      isNaN(designPayload.canvas.baseWidth) ||
      (typeof designPayload.canvas.baseWidth !== 'string' && typeof designPayload.canvas.baseWidth !== 'number')
    ) {
      throw new Error('design payload needs "canvas.baseWidth" property to be a valid number, check the "design" object in "template" property of request body')
    }

    designPayload.canvas.baseWidth = parseFloat(designPayload.canvas.baseWidth)

    if (
      isNaN(designPayload.canvas.numberOfCols) ||
      (typeof designPayload.canvas.numberOfCols !== 'string' && typeof designPayload.canvas.numberOfCols !== 'number')
    ) {
      throw new Error('design payload needs "canvas.numberOfCols" property to be a valid number, check the "design" object in "template" property of request body')
    }

    designPayload.canvas.numberOfCols = parseInt(designPayload.canvas.numberOfCols, 10)

    if (
      isNaN(designPayload.canvas.rowHeight) ||
      (typeof designPayload.canvas.rowHeight !== 'string' && typeof designPayload.canvas.rowHeight !== 'number')
    ) {
      throw new Error('design payload needs "canvas.rowHeight" property to be a valid number, check the "design" object in "template" property of request body')
    }

    designPayload.canvas.rowHeight = parseInt(designPayload.canvas.rowHeight, 10)

    if (designPayload.groups == null) {
      throw new Error('design payload needs "groups" property, check the "design" object in "template" property of request body')
    }

    if (designPayload.groups === '') {
      designPayload.groups = []
    }

    if (!Array.isArray(designPayload.groups)) {
      throw new Error('design payload needs "groups" property to be a valid array, check the "design" object in "template" property of request body')
    }

    req.logger.debug('Designer data specified, getting template content from components..')

    if (this.development) {
      // reload general resources when developing extensions to avoid re-starting
      // the server when changing some of them
      resolveResources = this.loadDesignResources()
    } else {
      // in normal case use the preloaded variables
      resolveResources = Promise.resolve({
        mainTemplate: this.mainTemplate,
        mainHelpers: this.mainHelpers,
        mainStyles: this.mainStyles
      })
    }

    return (
      resolveResources
        .then(({ mainTemplate, mainHelpers, mainStyles }) => {
          // TODO: only send the component types used in the design if there is
          // some hint in the json payload
          designInputs = {
            componentTypesDefinition: this.componentTypes,
            styles: [mainStyles],
            canvas: designPayload.canvas,
            computedFields: designPayload.computedFields,
            groups: designPayload.groups
          }

          if (req.template.helpers && typeof req.template.helpers === 'object') {
            // this is the case when the jsreport is used with in-process strategy
            // and additinal helpers are passed as object
            // in this case we need to merge in xlsx helpers
            req.template.helpers.require = require
            req.template.helpers.componentRegistry = require(path.join(__dirname, '../shared/componentRegistry'))
            req.template.helpers.evaluateScript = require(path.join(__dirname, '../shared/evaluateScript'))

            req.template.helpers.getDesignInputs = () => {
              return designInputs
            }

            return vm.runInNewContext(mainHelpers, req.template.helpers)
          }

          req.template = Object.assign(req.template, {
            content: mainTemplate,
            helpers: `let INPUTS = ${JSON.stringify(designInputs)}; \n ${mainHelpers}`,
            engine: 'handlebars'
          })
        })
    )
  }
}

function normalizePropsMetaDef (def, isRoot = true) {
  const defToUse = { ...def }
  const childrenPropsName = isRoot ? 'propsMeta' : 'properties'
  let ignoreDefaultStyleProp = false

  if (!defToUse[childrenPropsName]) {
    return defToUse
  }

  defToUse[childrenPropsName] = { ...defToUse[childrenPropsName] }

  if (isRoot) {
    if (defToUse[childrenPropsName][DEFAULT_STYLE_PROP_NAME] === false) {
      ignoreDefaultStyleProp = true

      // if component is declaring default style prop with false then don't add
      // the prop to the definition (disabling default style prop)
      delete defToUse[childrenPropsName][DEFAULT_STYLE_PROP_NAME]
    } else if (
      defToUse[childrenPropsName][DEFAULT_STYLE_PROP_NAME] == null
    ) {
      ignoreDefaultStyleProp = true

      // by default components have a style prop
      defToUse[childrenPropsName][DEFAULT_STYLE_PROP_NAME] = {
        styleProp: true
      }
    }
  } else {
    ignoreDefaultStyleProp = true
  }

  Object.keys(defToUse[childrenPropsName]).forEach((propName) => {
    if (propName === DEFAULT_STYLE_PROP_NAME && ignoreDefaultStyleProp) {
      return
    }

    const currentPropMeta = defToUse[childrenPropsName][propName]

    if (currentPropMeta == null) {
      defToUse[childrenPropsName][propName] = {}
    } else {
      defToUse[childrenPropsName][propName] = normalizePropsMetaDef(defToUse[childrenPropsName][propName], false)
    }
  })

  if (!isRoot) {
    return defToUse
  }

  if (defToUse.fragments != null) {
    defToUse.fragments = { ...defToUse.fragments }

    Object.keys(defToUse.fragments).forEach((fragName) => {
      defToUse.fragments[fragName] = normalizePropsMetaDef(defToUse.fragments[fragName], true, true)
    })
  }

  return defToUse
}

module.exports = function (reporter, definition) {
  const DEVELOPMENT = process.env.JSREPORT_DESIGNER_DEV != null
  const distPath = path.join(__dirname, '../static/dist')
  let compiler

  reporter.designer = new Designer(reporter, definition, DEVELOPMENT)

  reporter.on('after-authentication-express-routes', () => {
    return reporter.express.app.get('/designer', redirectOrSendIndex)
  })

  reporter.on('after-express-static-configure', function () {
    if (!reporter.authentication) {
      return reporter.express.app.get('/designer', redirectOrSendIndex)
    }
  })

  reporter.on('express-configure', (app) => {
    if (!DEVELOPMENT) {
      if (!fs.existsSync(path.join(distPath, 'extensions.client.js'))) {
        fs.renameSync(path.join(distPath, 'extensions.chunk.js'), path.join(distPath, 'extensions.client.js'))
      }

      const webpackWrap = fs.readFileSync(path.join(distPath, 'extensions.client.js'), 'utf8')

      const webpackExtensions = webpackWrap.replace('$extensionsHere', () => {
        return reporter.extensionsManager.extensions.map((e) => {
          try {
            return fs.readFileSync(path.join(e.directory, 'designer/main.js'))
          } catch (e) {
            return ''
          }
        }).join('\n')
      })

      fs.writeFileSync(path.join(distPath, 'extensions.chunk.js'), webpackExtensions)
    } else {
      fs.writeFileSync(path.join(__dirname, '../src/extensions_dev.js'), reporter.extensionsManager.extensions.map((e) => {
        try {
          fs.statSync(path.join(e.directory, '/designer/main_dev.js'))

          let pathToExtensionEntry = path.relative(
            path.join(__dirname, '../src'),
            path.join(e.directory, '/designer/main_dev.js')
          ).replace(/\\/g, '/')

          return `import '${pathToExtensionEntry}'`
        } catch (e) {
          return ''
        }
      }).join('\n'))
    }

    // TODO: since jsreport studio already enables compression at the app
    // level we should conditionally enable this when studio is not present
    // find a way later..
    // app.use('/designer', compression())
    app.use('/designer', favicon(path.join(path.join(__dirname, '../static'), 'favicon.ico')))

    if (DEVELOPMENT) {
      const designerDev = require('jsreport-designer-dev')
      const createCompiler = designerDev.createCompiler

      const {
        webpackDevMiddleware,
        webpackHotMiddleware,
        errorOverlayMiddleware
      } = designerDev.deps

      const webpackConfig = require('../webpack/dev.config')(
        reporter.options.rootDirectory,
        reporter.extensionsManager.extensions,
        reporter.designer.componentTypes
      )

      compiler = createCompiler(webpackConfig)

      app.use(webpackDevMiddleware(compiler, {
        publicPath: '/designer/assets/',
        lazy: false,
        // Reportedly, this avoids CPU overload on some systems.
        watchOptions: {
          ignored: /node_modules/
        },
        stats: { colors: true, chunks: false, modules: false }
      }))

      app.use(errorOverlayMiddleware())

      app.use(webpackHotMiddleware(compiler))
    }

    app.use('/designer/assets', serveStatic(path.join(__dirname, '../static', 'dist')))

    app.get('/designer/*', sendIndex)

    // TODO: remove this after get a probe of concept for embedding the designer in external apps
    // this is a sample app just for test embedding the designer
    app.get('/designer-browser-client', (req, res) => {
      let browserClientPath = path.join(__dirname, '../static/browser-client')
      res.sendFile(path.join(browserClientPath, 'index.js'))
    })

    // TODO: remove this after get a probe of concept for embedding the designer in external apps
    // this is a sample app just for test embedding the designer
    app.get('/sample-app', (req, res) => {
      let sampleAppPath = path.join(__dirname, '../static/sample-app')

      fs.readFile(path.join(sampleAppPath, 'index.html'), 'utf8', (err, content) => {
        if (err) {
          return res.status(500).send(`Error while trying to load sample app: ${err.message}`)
        }

        res.send(content)
      })
    })

    app.get('/api/componentTypes', (req, res) => {
      res.json(Object.keys(reporter.designer.componentTypes).reduce((result, compName) => {
        const comp = reporter.designer.componentTypes[compName]
        result[comp.name] = omit(comp, ['modulePath', 'directory'])
        return result
      }, {}))
    })

    app.get('/api/componentGeneralStyles', (req, res) => {
      res.json(generalStyles.styles)
    })
  })

  function sendIndex (req, res, next) {
    const indexHtml = path.join(distPath, 'index.html')

    function send (err, content) {
      if (err) {
        return next(err)
      }

      content = content.replace('client.js', reporter.options.appPath + 'designer/assets/client.js')

      res.send(content
        .replace('$jsreportVersion', reporter.version)
        .replace('$jsreportMode', reporter.options.mode))
    }

    function tryRead () {
      compiler.outputFileSystem.readFile(indexHtml, 'utf8', (err, content) => {
        if (err) {
          return setTimeout(tryRead, 1000)
        }

        send(null, content)
      })
    }

    if (DEVELOPMENT) {
      tryRead()
    } else {
      fs.readFile(indexHtml, 'utf8', send)
    }
  }

  function redirectOrSendIndex (req, res, next) {
    let reqUrl = url.parse(req.originalUrl)

    if (reqUrl.pathname[reqUrl.pathname.length - 1] !== '/') {
      return res.redirect(reqUrl.pathname + '/' + (reqUrl.search || ''))
    }

    sendIndex(req, res, next)
  }
}
