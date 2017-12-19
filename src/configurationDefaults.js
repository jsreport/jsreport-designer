import * as configuration from './lib/configuration.js'
import ComposeTextBindingEditor from './components/Editor/ComposeTextBindingEditor'
import DataSelectBindingEditor from './components/Editor/DataSelectBindingEditor'
// import CommandButton from './components/CommandButton'
// import DataInputCommand from './components/CommandBar/DataInputCommand'

export default () => {
  configuration.defaultBindingEditorComponents.composeText = ComposeTextBindingEditor
  configuration.defaultBindingEditorComponents.dataSelect = DataSelectBindingEditor
  configuration.defaultBindingEditorComponents.default = ComposeTextBindingEditor

  // TODO: complete this when i have Mobx store ready
  // configuration.toolbarComponents.generalCommands.push(() => (
  //   <CommandButton title="Data Input">
  //     <DataInputCommand dataInput={dataInput} onSave={onCommandSave} />
  //   </CommandButton>
  // ))
}
