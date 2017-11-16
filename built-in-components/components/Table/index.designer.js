import Designer from 'jsreport-designer'
import Table from './shared'
import TablePropertiesEditor from './TablePropertiesEditor'

export default () => ({
  name: 'Table',
  icon: 'fa-table',
  module: Table,
  propertiesEditor: TablePropertiesEditor
})
