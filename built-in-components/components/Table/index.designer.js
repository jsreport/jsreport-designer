import Table from './shared'
import TablePropertiesEditor from './TablePropertiesEditor'

export default () => ({
  name: 'Table',
  icon: 'fa-table',
  module: Table,
  propertiesEditor: TablePropertiesEditor,
  bindingEditorResolver: ({ propName, bindingName }) => {
    if (bindingName === 'data') {
      return { editor: 'dataSelect' }
    }
  }
})
