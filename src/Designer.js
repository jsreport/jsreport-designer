import * as configuration from './lib/configuration.js'
import PropertiesEditor, { PropertyControl } from './components/Editor/PropertiesEditor'

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
   * Add React component which will be displayed in toolbar
   *
   * @param {ReactComponent|Function} toolbarComponent
   * @param {String} position generalCommands
   */
  addToolbarComponent (toolbarComponent, position) {
    configuration.toolbarComponents[position].push(toolbarComponent)
  }

  /**
   * Add React component used in ComponentEditor as the properties editor of selected design component
   *
   * @param {String} key - id of the registered component
   * @param {ReactComponent|Function} component
   */
  addPropertiesEditorComponent (key, component) {
    configuration.propertiesEditorComponents[key] = component
  }

  /** /configuration **/

  /** react components **/

  /**
   * Component used as the default editor for design component properties
   *
   * @returns {PropertiesEditor}
   */
  get PropertiesEditor () {
    return PropertiesEditor
  }

  /**
   * Component used to visualise a design component property and its actions
   *
   * @returns {PropertyControl}
   */
  get PropertyControl () {
    return PropertyControl
  }

  /** /react components **/

  constructor () {

  }
}

let designer

export const createDesigner = (store) => (designer = new Designer(store))

export default designer
