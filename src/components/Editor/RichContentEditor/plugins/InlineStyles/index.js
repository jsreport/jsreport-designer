import decorateComponentWithProps from 'decorate-component-with-props'
import InlineStylesButtons from './InlineStylesButtons'

// object map for custom inline style in editor
const inlineStyleMap = {
  STRIKE: {
    textDecoration: 'line-through'
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
    customStyleMap: inlineStyleMap,
    convertStyleFrom: (element, { Style, Entity }) => {
      if (element.tagName === 'SPAN') {
        const result = Object.keys(inlineStyleMap.STRIKE).every((cssKey) => {
          return element.style[cssKey] = inlineStyleMap.STRIKE[cssKey]
        })

        if (result) {
          return Style('STRIKE')
        }
      }
    },
    convertStyleTo: () => {
      return Object.keys(inlineStyleMap).reduce((styles, styleKey) => {
        styles[styleKey] = {
          style: inlineStyleMap[styleKey]
        }

        return styles
      }, {})
    },
    InlineStylesButtons: decorateComponentWithProps(InlineStylesButtons, { store })
  }
}
