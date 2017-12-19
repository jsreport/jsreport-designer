import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { EditorState } from 'draft-js'
import findEntityRangeInBlock from './findEntityRangeInBlock'

// TODO: add or remove expressions when placeholder are deleted
// or created by pasting text in the input
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

    const expressionSelectionRange = findEntityRangeInBlock(
      contentState,
      currentBlockKey,
      currentEntityKey
    )

    setEditorState(EditorState.forceSelection(editorState, expressionSelectionRange))
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
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
  setEditorState: PropTypes.func.isRequired,
  getEditorState: PropTypes.func.isRequired,
  contentState: PropTypes.any.isRequired,
  offsetKey: PropTypes.string.isRequired,
  entityKey: PropTypes.string.isRequired
}

export default ExpressionPlaceholder
