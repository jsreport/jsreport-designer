import { SelectionState } from 'draft-js'
import entityType from './entityType'

export default (contentState, blockKey, currentEntityKey) => {
  const block = contentState.getBlockForKey(blockKey)
  let expressionStart
  let expressionEnd

  if (!block) {
    return
  }

  block.findEntityRanges((character) => {
    const entityKey = character.getEntity()

    return (
      entityKey !== null &&
      entityKey === currentEntityKey &&
      contentState.getEntity(entityKey).getType() === entityType
    )
  }, (start, end) => {
    expressionStart = start
    expressionEnd = end
  })

  if (expressionStart == null || expressionEnd == null) {
    return undefined
  }

  let newSelection = SelectionState.createEmpty(blockKey)

  newSelection = newSelection.merge({
    anchorOffset: expressionStart,
    focusOffset: expressionEnd
  })

  return newSelection
}
