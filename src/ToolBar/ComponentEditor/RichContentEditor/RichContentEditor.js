import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { convertToRaw } from 'draft-js'
import { stateToHTML } from 'draft-js-export-html'
import ContentEditor from './ContentEditor'

// object map for custom style in editor
const editorStyleMap = {
  STRIKE: {
    textDecoration: 'line-through'
  }
}

class RichContentEditor extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isDirty: false
    }

    this.lastContentState = null

    this.getContentRepresentation = this.getContentRepresentation.bind(this)
    this.handleEditorContentChange = this.handleEditorContentChange.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
  }

  getContentRepresentation (contentState) {
    const { propName } = this.props
    let rawContent = convertToRaw(contentState)

    return {
      propName,
      rawContent,
      html: stateToHTML(contentState, {
        defaultBlockTag: 'div',
        inlineStyles: Object.keys(editorStyleMap).reduce((styles, styleKey) => {
          styles[styleKey] = {
            style: editorStyleMap[styleKey]
          }

          return styles
        }, {})
      })
    }
  }

  handleEditorContentChange (contentState) {
    this.lastContentState = contentState
  }

  handleSave () {
    const { onSave } = this.props
    const { getContentRepresentation, lastContentState } = this

    if (onSave) {
      onSave(getContentRepresentation(lastContentState))
    }
  }

  handleRemove () {
    const { propName, onRemove } = this.props
    const { getContentRepresentation, lastContentState } = this

    if (onRemove) {
      onRemove({ propName, rawContent: null, html: null })
    }
  }

  render () {
    const { isDirty } = this.state
    const { componentType, propName, initialContent, onClose } = this.props

    return (
      <div
        style={{
          position: 'fixed',
          top: '50px',
          left: '200px',
          zIndex: 100,
          color: '#000',
          backgroundColor: 'yellow',
          padding: '8px',
          width: '500px'
        }}
      >
        <h3 style={{ marginTop: '0.3rem', marginBottom: '0.3rem' }}>
          Rich Content Editor - {`${componentType} (property: ${propName}${isDirty ? '*' : ''})`}
        </h3>
        <br />
        <div style={{ fontSize: '0.7rem' }}>
          Edit the content using the editor bellow
        </div>
        <div style={{
          marginTop: '0.6rem',
          marginBottom: '0.6rem',
          overflow: 'auto'
        }}
        >
          <ContentEditor
            styleMap={editorStyleMap}
            initialContent={initialContent}
            onContentChange={this.handleEditorContentChange}
          />
        </div>
        <br />
        <button onClick={this.handleSave}>Save</button>
        <button onClick={this.handleRemove}>Remove rich content</button>
        {' '}
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}

RichContentEditor.propTypes = {
  componentType: PropTypes.string.isRequired,
  propName: PropTypes.string.isRequired,
  initialContent: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onSave: PropTypes.func,
  onRemove: PropTypes.func,
  onClose: PropTypes.func
}

export default RichContentEditor
