import Designer from 'jsreport-designer'
import Box from '../components/Box/index.designer.js'
import Text from '../components/Text/index.designer.js'
import Image from '../components/Image/index.designer.js'
import Table from '../components/Table/index.designer.js'

const PropertiesEditor = Designer.PropertiesEditor

Designer.registerComponent(Box())
Designer.registerComponent(Text())
Designer.registerComponent(Image())
Designer.registerComponent(Table())

// NOTE: next are placeholder components just to fill component bar in designer
// (delete them later)
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
