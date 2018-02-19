import Designer from 'jsreport-designer'
import Box from './shared'

const PropertiesEditor = Designer.PropertiesEditor

export default () => ({
  name: 'Box',
  icon: 'fa-square',
  module: Box,
  propertiesEditor: PropertiesEditor
})
