import Designer from 'jsreport-designer'
import Text from './shared'

const PropertiesEditor = Designer.PropertiesEditor

export default () => ({
  name: 'Text',
  icon: 'fa-font',
  module: Text,
  propertiesEditor: PropertiesEditor
})
