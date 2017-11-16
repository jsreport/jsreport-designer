import Designer from 'jsreport-designer'
import Image from './shared'

const PropertiesEditor = Designer.PropertiesEditor

export default () => ({
  name: 'Image',
  icon: 'fa-image',
  module: Image,
  propertiesEditor: PropertiesEditor
})
