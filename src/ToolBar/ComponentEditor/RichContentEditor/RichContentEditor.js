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

    this.handleEditorContentChange = this.handleEditorContentChange.bind(this)
    this.handleSave = this.handleSave.bind(this)
  }

  handleEditorContentChange (contentState) {
    this.lastContentState = contentState
  }

  handleSave () {
    let rawContent = convertToRaw(this.lastContentState)

    if (this.props.onSave) {
      this.props.onSave({
        propName: this.props.propName ,
        rawContent,
        html: stateToHTML(this.lastContentState, {
          defaultBlockTag: 'div',
          inlineStyles: Object.keys(editorStyleMap).reduce((styles, styleKey) => {
            styles[styleKey] = {
              style: editorStyleMap[styleKey]
            }

            return styles
          }, {})
        })
      })
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
  onClose: PropTypes.func
}

export default RichContentEditor
