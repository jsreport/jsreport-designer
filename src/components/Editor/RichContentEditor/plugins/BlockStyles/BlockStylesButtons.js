import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { RichUtils } from 'draft-js'
import Button from '../../Button'

// list of supported block styles buttons
const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  { label: 'Blockquote', style: 'blockquote', icon: 'quote-left' },
  { label: 'UL', style: 'unordered-list-item', icon: 'list-ul' },
  { label: 'OL', style: 'ordered-list-item', icon: 'list-ol' }
]

class BlockStylesButtons extends Component {
  constructor (props) {
    super(props)

    this.handleToogle = this.handleToogle.bind(this)
  }

  handleToogle (blockType) {
    const { editorState, store } = this.props

    store.setEditorState(
      RichUtils.toggleBlockType(editorState, blockType)
    )
  }

  render () {
    const { editorState } = this.props
    const selection = editorState.getSelection()

    const blockType = (
      editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType()
    )

    return (
      BLOCK_TYPES.map(type => (
        <Button
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={this.handleToogle}
          icon={type.icon}
          context={type.style}
        />
      ))
    )
  }
}

BlockStylesButtons.propTypes = {
  store: PropTypes.object.isRequired,
  editorState: PropTypes.any.isRequired
}

export default BlockStylesButtons
