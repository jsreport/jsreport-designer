import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { EditorState, SelectionState } from 'draft-js'
import entityType from './entityType'

class ExpressionPlaceholder extends Component {
  constructor (props) {
    super(props)

    this.handleMouseDown = this.handleMouseDown.bind(this)
  }

  handleMouseDown (ev) {
    ev.preventDefault()

    // if some part of the expression is selected then
    // select the text in the editor
    const {
      setEditorState,
      getEditorState,
      contentState,
      offsetKey,
      entityKey: currentEntityKey
    } = this.props

    const editorState = getEditorState()

    // hacky way to get the block key of the decorated component
    // we will avoid this when this is resolved:
    // https://github.com/facebook/draft-js/issues/1394
    const currentBlockKey = offsetKey.split('-')[0]
    const currentBlock = contentState.getBlockForKey(currentBlockKey)
    let expressionStart
    let expressionEnd

    if (!currentBlock) {
      return
    }

    currentBlock.findEntityRanges((character) => {
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
      return
    }

    let newSelection = SelectionState.createEmpty(currentBlockKey)

    newSelection = newSelection.merge({
      anchorOffset: expressionStart,
      focusOffset: expressionEnd
    })

    setEditorState(EditorState.forceSelection(editorState, newSelection))
  }

  render () {
    const { children } = this.props

    return (
      <span
        style={{
          backgroundColor: '#d4e21a',
          borderRadius: '3px',
          padding: '1px 2px'
        }}
        contentEditable={false}
        onMouseDown={this.handleMouseDown}
      >
        {children}
      </span>
    )
  }
}

ExpressionPlaceholder.propTypes = {
  children: PropTypes.element,
  setEditorState: PropTypes.func.isRequired,
  getEditorState: PropTypes.func.isRequired,
  contentState: PropTypes.any.isRequired,
  offsetKey: PropTypes.string.isRequired,
  entityKey: PropTypes.string.isRequired
}

export default ExpressionPlaceholder
