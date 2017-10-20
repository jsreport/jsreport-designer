import * as configuration from './lib/configuration.js'
import { PropertiesEditor } from './components/Editor'
import TablePropertiesEditor from './components/Editor/TablePropertiesEditor'
import CommandButton from './components/CommandButton'
import DataInputCommand from './components/CommandBar/DataInputCommand'
import Text from '@local/shared/components/Text'
import Image from '@local/shared/components/Image'
import Table from '@local/shared/components/Table'

export default () => {
  // TODO: complete this when i have Mobx store ready
  // configuration.toolbarComponents.generalCommands.push(() => (
  //   <CommandButton title="Data Input">
  //     <DataInputCommand dataInput={dataInput} onSave={onCommandSave} />
  //   </CommandButton>
  // ))

  // default components
  configuration.componentTypes.Text = {
    name: 'Text',
    icon: 'fa-font',
    module: Text,
    propertiesEditor: PropertiesEditor
  }

  configuration.componentTypes.Image = {
    name: 'Image',
    icon: 'fa-image',
    module: Image,
    propertiesEditor: PropertiesEditor
  }

  configuration.componentTypes.Table = {
    name: 'Table',
    icon: 'fa-table',
    module: Table,
    propertiesEditor: TablePropertiesEditor
  }

  configuration.componentTypes['Products-Map'] = {
    name: 'Products-Map',
    icon: 'fa-map',
    propertiesEditor: PropertiesEditor
  }

  configuration.componentTypes['Pie-Chart'] = {
    name: 'Pie-Chart',
    icon: 'fa-pie-chart',
    propertiesEditor: PropertiesEditor
  }

  configuration.componentTypes.QR = {
    name: 'QR',
    icon: 'fa-qrcode',
    propertiesEditor: PropertiesEditor
  }

  configuration.componentTypes['User-Info'] = {
    name: 'User-Info',
    icon: 'fa-address-card',
    propertiesEditor: PropertiesEditor
  }
}
