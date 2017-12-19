import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { RichUtils } from 'draft-js'
import Button from '../../Button'

// list of supported inline styles buttons
const INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD', icon: 'bold' },
  { label: 'Italic', style: 'ITALIC', icon: 'italic' },
  { label: 'Underline', style: 'UNDERLINE', icon: 'underline' },
  { label: 'Strikethrough', style: 'STRIKE', icon: 'strikethrough' }
]

class InlineStylesButtons extends Component {
  constructor (props) {
    super(props)

    this.handleToogle = this.handleToogle.bind(this)
  }

  handleToogle (inlineStyleName) {
    const { editorState, store } = this.props

    store.setEditorState(
      RichUtils.toggleInlineStyle(editorState, inlineStyleName)
    )
  }

  render () {
    // we are getting editorState from a prop and not
    // from plugin's getEditorState to avoid getting a stale editorState
    // when the buttons are rendered before the Editor
    // more info: https://github.com/draft-js-plugins/draft-js-plugins/issues/834
    const { editorState } = this.props
    let currentStyle = editorState.getCurrentInlineStyle()

    return (
      INLINE_STYLES.map(type => {
        return (
          <Button
            key={type.label}
            active={currentStyle && currentStyle.has(type.style)}
            label={type.label}
            onToggle={this.handleToogle}
            icon={type.icon}
            context={type.style}
          />
        )
      })
    )
  }
}

InlineStylesButtons.propTypes = {
  store: PropTypes.object.isRequired,
  editorState: PropTypes.any.isRequired
}

export default InlineStylesButtons
