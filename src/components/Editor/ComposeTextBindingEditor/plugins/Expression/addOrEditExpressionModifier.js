import { EditorState, Modifier } from 'draft-js'
import findEntityRangeInBlock from './findEntityRangeInBlock'
import entityType, { entityMutability } from './entityType'

export default (prevExpEntityKey, editorState, selection, expressionName) => {
  const contentState = editorState.getCurrentContent()

  if (!prevExpEntityKey) {
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
  } else {
    const currentBlockKey = selection.getAnchorKey()
    let contentStateWithExpression = contentState.mergeEntityData(
      prevExpEntityKey,
      { name: expressionName }
    )

    let expressionSelectionRange = findEntityRangeInBlock(
      contentStateWithExpression,
      currentBlockKey,
      prevExpEntityKey
    )

    // getting the current inline styles in expressions to
    // be able to propagate to the changed text
    const currentInlineStyles = contentStateWithExpression.getBlockForKey(currentBlockKey).getInlineStyleAt(
      expressionSelectionRange.getAnchorOffset()
    )

    contentStateWithExpression = Modifier.replaceText(
      contentStateWithExpression,
      expressionSelectionRange,
      `[${expressionName}]`,
      currentInlineStyles,
      prevExpEntityKey
    )

    return EditorState.forceSelection(
      EditorState.set(editorState, {
        currentContent: contentStateWithExpression
      }),
      contentStateWithExpression.getSelectionAfter()
    )
  }
}
