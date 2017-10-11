import * as configuration from './lib/configuration.js'
import { PropertiesEditor } from './components/Editor'
import TablePropertiesEditor from './components/Editor/TablePropertiesEditor'

export default () => {
  // configuration.toolbarComponents.generalCommands.push()

  configuration.defaultComponents.propertiesEditor = PropertiesEditor

  // algo parecido para mostrar grupo de propiedades?
  // configuration.propertiesComponents.push({
  //   title: TemplateProperties.title,
  //   shouldDisplay: (entity) => entity.__entitySet === 'templates',
  //   component: TemplateProperties
  // })

  // TODO: remove this, it is here just for testing
  configuration.propertiesEditorComponents['Table'] = TablePropertiesEditor
}
