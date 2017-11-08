import Designer from 'jsreport-designer'
import Text from '../shared/Text'
import Image from '../shared/Image'
import Table from '../shared/Table'
import TablePropertiesEditor from './TablePropertiesEditor'

const PropertiesEditor = Designer.PropertiesEditor

Designer.registerComponent({
  name: 'Text',
  icon: 'fa-font',
  module: Text,
  propertiesEditor: PropertiesEditor
})

Designer.registerComponent({
  name: 'Image',
  icon: 'fa-image',
  module: Image,
  propertiesEditor: PropertiesEditor
})

Designer.registerComponent({
  name: 'Table',
  icon: 'fa-table',
  module: Table,
  propertiesEditor: TablePropertiesEditor
})

Designer.registerComponent({
  name: 'Products-Map',
  icon: 'fa-map',
  propertiesEditor: PropertiesEditor
})

Designer.registerComponent({
  name: 'Products-Map',
  icon: 'fa-map',
  propertiesEditor: PropertiesEditor
})

Designer.registerComponent({
  name: 'Pie-Chart',
  icon: 'fa-pie-chart',
  propertiesEditor: PropertiesEditor
})

Designer.registerComponent({
  name: 'QR',
  icon: 'fa-qrcode',
  propertiesEditor: PropertiesEditor
})

Designer.registerComponent({
  name: 'User-Info',
  icon: 'fa-address-card',
  propertiesEditor: PropertiesEditor
})
