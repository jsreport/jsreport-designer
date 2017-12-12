import { EditorState, Modifier } from 'draft-js'
import entityType, { entityMutability } from './entityType'

export default (editorState, selection, expressionName) => {
  const contentState = editorState.getCurrentContent()
  const currentBlockKey = selection.getAnchorKey()
  const currentBlockSize = contentState.getBlockForKey(currentBlockKey).getLength()

  let contentStateWithExpression = contentState.createEntity(
    entityType,
    entityMutability,
    { name: expressionName }
  )

  const expressionEntityKey = contentStateWithExpression.getLastCreatedEntityKey()

  contentStateWithExpression = Modifier.insertText(
    contentStateWithExpression,
    selection,
    `[${expressionName}]`,
    null,
    expressionEntityKey
  )

  // If the expression is inserted at the end, a space is appended right after for
  // a smooth writing experience.
  if (selection.getEndOffset() === currentBlockSize) {
    contentStateWithExpression = Modifier.insertText(
      contentStateWithExpression,
      contentStateWithExpression.getSelectionAfter(),
      ' '
    )
  }

  return EditorState.forceSelection(
    EditorState.set(editorState, {
      currentContent: contentStateWithExpression
    }),
    contentStateWithExpression.getSelectionAfter()
  )
}
