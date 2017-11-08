
const path = require('path')
const url = require('url')
const fs = require('fs')
const vm = require('vm')
const serveStatic = require('serve-static')
const favicon = require('serve-favicon')
const Promise = require('bluebird')
const componentRegistry = require('@local/shared/componentRegistry')
const readFileAsync = Promise.promisify(fs.readFile)

// TODO: prepare the file to support jsreport compilation
class Designer {
  constructor (reporter, definition) {
    this.reporter = reporter
    this.definition = definition
    this.componentTypes = {}
    this.componentTypesModulePath = {}
    this.mainStyles = []

    reporter.options.tasks.modules.push({
      alias: 'handlebars',
      path: require.resolve('handlebars')
    })

    reporter.options.tasks.modules.push({
      alias: 'componentRegistry.js',
      path: path.join(__dirname, '../shared/componentRegistry')
    })

    reporter.initializeListeners.add(definition.name, () => {
      let designTemplatePath = path.join(__dirname, './static/designTemplate.hbs')

      // allowing importing components in jsreport helpers
      Object.keys(this.componentTypes).forEach((compName) => {
        let compModulePath = this.componentTypesModulePath[compName]
        let fullPath

        if (compModulePath == null) {
          return
        }

        reporter.options.tasks.modules.push({
          alias: compModulePath,
          path: compModulePath
        })
      })

      return Promise.all([
        readFileAsync(designTemplatePath, 'utf8'),
        readFileAsync(path.join(__dirname, './static/designHelpers.js'), 'utf8'),
        readFileAsync(path.join(__dirname, '../src/components/Design/Canvas/DesignContainer.css'), 'utf8'),
        readFileAsync(path.join(__dirname, '../src/components/Design/Canvas/DesignGroup.css'), 'utf8'),
        readFileAsync(path.join(__dirname, '../src/components/Design/Canvas/DesignItem.css'), 'utf8')
      ]).then((results) => {
        this.mainTemplate = results[0]
        this.mainHelpers = results[1]
        this.mainStyles = this.mainStyles.concat(results.slice(2))
      })
    })

    reporter.beforeRenderListeners.insert(
      { before: 'templates' },
      definition.name,
      this.renderDesign.bind(this)
    )
  }

  registerComponent (componentDefinition, componentModulePath) {
    let reporter = this.reporter

    reporter.logger.debug(`Registering component ${componentDefinition.name} for designer`)

    this.componentTypes[componentDefinition.name] = componentDefinition

    if (componentModulePath != null) {
      this.componentTypesModulePath[componentDefinition.name] = require.resolve(componentModulePath)
    }
  }

  renderDesign (req, res) {
    let designPayload
    let designOutput
    let designInputs

    if (!req.template || !req.template.design) {
      return
    }

    req.logger.debug('Designer data specified, getting template content from components..')

    designPayload = req.template.design

    console.log('DATA INPUT:', req.data)
    console.log('DESIGN PAYLOAD:', designPayload)

    if (designPayload.grid == null) {
      throw new Error('design payload needs "grid" property, check the "design" object in "template" property of request body')
    }

    if (typeof designPayload.grid !== 'object' || (typeof designPayload.grid === 'object' && Array.isArray(designPayload.grid))) {
      throw new Error('design payload needs "grid" property to be an object, check the "design" object in "template" property of request body')
    }

    if (
      isNaN(designPayload.grid.width) ||
      (typeof designPayload.grid.width !== 'string' && typeof designPayload.grid.width !== 'number')
    ) {
      throw new Error('design payload needs "grid.width" property to be a valid number, check the "design" object in "template" property of request body')
    }

    designPayload.grid.width = parseFloat(designPayload.grid.width)

    if (
      isNaN(designPayload.grid.numberOfCols) ||
      (typeof designPayload.grid.numberOfCols !== 'string' && typeof designPayload.grid.numberOfCols !== 'number')
    ) {
      throw new Error('design payload needs "grid.numberOfCols" property to be a valid number, check the "design" object in "template" property of request body')
    }

    designPayload.grid.numberOfCols = parseInt(designPayload.grid.numberOfCols, 10)

    if (
      isNaN(designPayload.grid.defaultRowHeight) ||
      (typeof designPayload.grid.defaultRowHeight !== 'string' && typeof designPayload.grid.defaultRowHeight !== 'number')
    ) {
      throw new Error('design payload needs "grid.defaultRowHeight" property to be a valid number, check the "design" object in "template" property of request body')
    }

    designPayload.grid.defaultRowHeight = parseInt(designPayload.grid.defaultRowHeight, 10)

    if (designPayload.groups == null) {
      throw new Error('design payload needs "groups" property, check the "design" object in "template" property of request body')
    }

    if (designPayload.groups === '') {
      designPayload.groups = []
    }

    if (!Array.isArray(designPayload.groups)) {
      throw new Error('design payload needs "groups" property to be a valid array, check the "design" object in "template" property of request body')
    }

    // TODO: only send the component types used in the design if there is
    // some hint in the json payload
    designInputs = {
      componentTypesDefinition: this.componentTypes,
      componentTypesModulePath: this.componentTypesModulePath,
      styles: this.mainStyles,
      grid: designPayload.grid,
      groups: designPayload.groups
    }

    if (req.template.helpers && typeof req.template.helpers === 'object') {
      // this is the case when the jsreport is used with in-process strategy
      // and additinal helpers are passed as object
      // in this case we need to merge in xlsx helpers
      req.template.helpers.require = require
      req.template.helpers.componentRegistry = require(path.join(__dirname, '../src/shared/componentRegistry'))

      req.template.helpers.getDesignInputs = () => {
        return designInputs
      }

      return vm.runInNewContext(this.mainHelpers, req.template.helpers)
    }

    req.template = Object.assign(req.template, {
      content: this.mainTemplate,
      helpers: `let INPUTS = ${JSON.stringify(designInputs)}; \n ${this.mainHelpers}`,
      engine: 'handlebars'
    })
  }
}

module.exports = function (reporter, definition) {
  const IS_DEV = process.env.JSREPORT_DESIGNER_DEV != null
  const distPath = path.join(__dirname, '../static/dist')
  let compiler

  definition.options.isDev = IS_DEV

  reporter.designer = new Designer(reporter, definition)

  reporter.on('after-authentication-express-routes', () => {
    return reporter.express.app.get('/designer', redirectOrSendIndex)
  })

  reporter.on('after-express-static-configure', function () {
    if (!reporter.authentication) {
      return reporter.express.app.get('/designer', redirectOrSendIndex)
    }
  })

  reporter.on('express-configure', (app) => {
    if (!IS_DEV) {
      if (!fs.existsSync(path.join(distPath, 'extensions.client.js'))) {
        fs.renameSync(path.join(distPath, '1.client.js'), path.join(distPath, 'extensions.client.js'))
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

      fs.writeFileSync(path.join(distPath, '1.client.js'), webpackExtensions)
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

    if (IS_DEV) {
      const {
        webpack,
        webpackDevMiddleware,
        webpackHotMiddleware,
        errorOverlayMiddleware
      } = require('jsreport-designer-dev').deps

      const webpackConfig = require('../webpack/dev.config')(
        reporter.options.rootDirectory,
        reporter.extensionsManager.extensions
      )

      compiler = webpack(webpackConfig)

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

    app.get('/api/componentTypes', (req, res) => {
      res.json(reporter.designer.componentTypes)
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

    if (IS_DEV) {
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
