import bluebird from 'bluebird'
import _ from 'lodash'
import React from 'react'
import ReactDom from 'react-dom'
import superagent from 'superagent'
import handlebars from 'handlebars'
import babelRuntime from './lib/babelRuntime.js'
import * as configuration from './lib/configuration.js'
import api, { methods } from './helpers/api.js'
import generalProps from '../shared/generalProps'
import expressionUtils from '../shared/expressionUtils'
import DataFieldsViewer from './components/DataFieldsViewer'

/**
 * Main facade and API for extensions. Exposed as global variable Designer.
 * It can be also imported from jsreport-designer when using extensions
 * default webpack configuration
 * @class
 * @public
 */
class Designer {
  /** event listeners **/

  /**
   * Array of async functions invoked in sequence during initialization
   * @returns {Function[]}
   */
  get initializeListeners () {
    return configuration.initializeListeners
  }

  /**
   * Array of async functions invoked in sequence after the app has been rendered
   * @returns {Function[]}
   */
  get readyListeners () {
    return configuration.readyListeners
  }

  /** /event listeners **/

  /** configuration **/

  /**
   * Registers new design component type, which will be available in ComponentBar and in the rest of designer
   * @example Designer.registerComponent({ name: 'Text', icon: 'fa-text', module: TextImport, propertiesEditor: CustomPropertiesEditorComponent })
   * @param {Object} componentConfig - configuration for the component (meta-data)
   */
  registerComponent (componentConfig) {
    configuration.componentTypes[componentConfig.name] = { ...componentConfig }

    // default propertiesEditor
    if (componentConfig.propertiesEditor == null) {
      configuration.componentTypes[componentConfig.name].propertiesEditor = configuration.defaultEditors.propertiesEditor
    }
  }

  /**
   * Add React component which will be displayed in toolbar
   *
   * @param {ReactComponent|Function} toolbarComponent
   * @param {String} position generalCommands
   */
  addToolbarComponent (toolbarComponent, position) {
    configuration.toolbarComponents[position].push(toolbarComponent)
  }

  /** /configuration **/

  /** runtime helpers **/

  /**
   * Provides methods get,patch,post,del for accessing jsreport server
   *
   * @example
   * await Designer.api.patch('/odata/tasks', { data: { foo: '1' } })
   *
   * @returns {*}
   */
  get api () {
    return this.API
  }

  /**
   * Get registered component types definitions, each one is object { name: 'Text', propsMeta: {} }
   * @returns {Object}
   */
  get componentTypesDefinition () {
    return configuration.componentTypesDefinition
  }

  /**
   * Get registered component types, each one is object { name: 'Text', icon: 'fa-text', module: TextImport, propertiesEditor: CustomPropertiesEditorComponent }
   * @returns {Object}
   */
  get componentTypes () {
    return configuration.componentTypes
  }

  /**
   * Object[name] with registered extensions and its options
   * @returns {Object}
   */
  get extensions () {
    return configuration.extensions
  }

  /**
   * Get name of the prop that contains all the general props
   * @returns {String}
   */
  get generalPropName () {
    return generalProps.generalPropName
  }

  /** /runtime helpers **/

  /** react components **/

  /**
   * Component used as the default editor for design component properties
   *
   * @returns {PropertiesEditor}
   */
  get PropertiesEditor () {
    return configuration.defaultEditors.propertiesEditor
  }

  /**
   * Component used to visualise (show/hide) a group of properties
   *
   * @returns {PropertiesGroup}
   */
  get PropertiesGroup () {
    return configuration.defaultEditors.propertiesGroup
  }

  /**
   * Component used to visualise a design component property and its actions
   *
   * @returns {PropertyControl}
   */
  get PropertyControl () {
    return configuration.defaultEditors.propertyControl
  }

  /**
   * Component used to visualise data input fields and computed fields
   *
   * @returns {DataFieldsViewer}
   */
  get DataFieldsViewer () {
    return DataFieldsViewer
  }

  /** /react components **/

  constructor (stores, actions) {
    this.stores = stores
    this.expressionUtils = expressionUtils
    this.API = {}

    methods.forEach((m) => {
      this.API[m] = (...args) => {
        return api[m](...args).catch((e) => {
          actions.editorActions.update({ apiError: e })
          throw e
        })
      }
    })

    // webpack replaces all the babel runtime references in extensions with externals taking runtime from this field
    // this basically removes the duplicated babel runtime code from extensions and decrease its sizes
    this.runtime = babelRuntime

    // the same case as for babel runtime, we expose the following libraries and replace their references in extensions
    // using webpack externals
    this.libraries = {
      react: React,
      'react-dom': ReactDom,
      superagent: superagent,
      bluebird: bluebird,
      lodash: _,
      handlebars: handlebars
    }
  }
}

let designer

export const createDesigner = (store, actions) => (designer = new Designer(store, actions))

export default designer
