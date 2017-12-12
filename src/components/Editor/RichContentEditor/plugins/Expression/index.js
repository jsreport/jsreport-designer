import decorateComponentWithProps from 'decorate-component-with-props'
import expressionStrategy from './expressionStrategy'
import ExpressionButton from './ExpressionButton'
import ExpressionPlaceholder from './ExpressionPlaceholder'
import entityType, { entityMutability } from './entityType'

export default (config = {}) => {
  const store = {
    setEditorState: undefined
  }

  return {
    initialize: ({ setEditorState }) => {
      store.setEditorState = setEditorState
    },
    decorators: [
      {
        strategy: expressionStrategy,
        component: ExpressionPlaceholder
      }
    ],
    ExpressionButton: decorateComponentWithProps(ExpressionButton, { store }),
    convertEntityFrom: (element, { Style, Entity }) => {
      if (element.tagName === 'CODE') {
        return Entity(entityType, {
          name: element.getAttribute('data-jsreport-designer-expression-name')
        }, entityMutability)
      }
    },
    convertEntityTo: (entity) => {
      const evaluatedEntityType = entity.get('type')

      if (evaluatedEntityType !== entityType) {
        return
      }

      const data = entity.getData()

      return {
        element: 'code',
        attributes: {
          'data-jsreport-designer-expression-name': data.name
        }
      }
    }
  }
}
