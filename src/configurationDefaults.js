import * as configuration from './lib/configuration.js'
import isStyleProp from '../shared/isStyleProp'
import ComposeTextBindingEditor from './components/Editor/ComposeTextBindingEditor'
import DataSelectBindingEditor from './components/Editor/DataSelectBindingEditor'
import StylesBindingEditor from './components/Editor/StylesBindingEditor'
import MarginStyleControl from './components/Editor/StylesControl/MarginControl'
import PaddingStyleControl from './components/Editor/StylesControl/PaddingControl'
import BackgroundStyleControl from './components/Editor/StylesControl/BackgroundControl'
import FontSizeStyleControl from './components/Editor/StylesControl/FontSizeControl'
import TextAlignStyleControl from './components/Editor/StylesControl/TextAlignControl'
import ColorStyleControl from './components/Editor/StylesControl/ColorControl'
// import CommandButton from './components/CommandButton'
// import DataInputCommand from './components/CommandBar/DataInputCommand'

export default () => {
  configuration.bindingEditor.defaultComponents.composeText = ComposeTextBindingEditor
  configuration.bindingEditor.defaultComponents.dataSelect = DataSelectBindingEditor
  configuration.bindingEditor.defaultComponents.style = StylesBindingEditor
  configuration.bindingEditor.defaultComponents.default = ComposeTextBindingEditor

  configuration.bindingEditor.defaultResolver = ({ propName, getPropMeta }) => {
    const meta = getPropMeta(propName)

    if (isStyleProp(meta)) {
      return { editor: StylesBindingEditor }
    }
  }

  configuration.generalStylesDefinition.margin = {
    control: MarginStyleControl
  }

  configuration.generalStylesDefinition.padding = {
    control: PaddingStyleControl
  }

  configuration.generalStylesDefinition.background = {
    control: BackgroundStyleControl
  }

  configuration.generalStylesDefinition.fontSize = {
    displayName: 'font size',
    control: FontSizeStyleControl
  }

  configuration.generalStylesDefinition.textAlign = {
    displayName: 'text alignment',
    control: TextAlignStyleControl
  }

  configuration.generalStylesDefinition.color = {
    control: ColorStyleControl
  }

  // TODO: complete this when i have Mobx store ready
  // configuration.toolbarComponents.generalCommands.push(() => (
  //   <CommandButton title="Data Input">
  //     <DataInputCommand dataInput={dataInput} onSave={onCommandSave} />
  //   </CommandButton>
  // ))
}
