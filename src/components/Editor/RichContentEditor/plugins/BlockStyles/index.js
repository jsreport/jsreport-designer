import { RichUtils } from 'draft-js'
import decorateComponentWithProps from 'decorate-component-with-props'
import BlockStylesButtons from './BlockStylesButtons'
import blockStyles from './BlockStyles.scss'

function getBlockStyle (block) {
  switch (block.getType()) {
    case 'blockquote':
      return blockStyles.blockquote
    default:
      return null
  }
}

export default (config = {}) => {
  const store = {
    setEditorState: undefined
  }

  return {
    initialize: ({ setEditorState }) => {
      store.setEditorState = setEditorState
    },
    blockStyleFn: getBlockStyle,
    onTab: (ev, { getEditorState }) => {
      const maxDepth = 4
      store.setEditorState(RichUtils.onTab(ev, getEditorState(), maxDepth))
    },
    BlockStylesButtons: decorateComponentWithProps(BlockStylesButtons, { store })
  }
}
