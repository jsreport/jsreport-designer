import React, { Component } from 'react'
import PropTypes from 'prop-types'
import omit from 'lodash/omit'
import ContentEditor from './ContentEditor'

class ComposeTextBindingEditor extends Component {
  constructor (props) {
    super(props)

    const initialState = {
      isDirty: false
    }

    this.state = initialState

    this.setEditorRef = this.setEditorRef.bind(this)
    this.getInitialContent = this.getInitialContent.bind(this)
    this.changeBinding = this.changeBinding.bind(this)
    this.handleContentChange = this.handleContentChange.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
  }

  static getOptions ({ propName, getPropMeta }) {
    const propMeta = getPropMeta(propName)
    let allowedDataExpressionTypes

    if (propMeta != null && Array.isArray(propMeta.allowedBindingValueTypes)) {
      allowedDataExpressionTypes = propMeta.allowedBindingValueTypes
    } else {
      // no types allowed
      allowedDataExpressionTypes = []
    }

    return {
      allowedDataExpressionTypes
    }
  }

  setEditorRef (el) {
    this.editor = el
  }

  getInitialContent () {
    const { propName, binding, component } = this.props

    if (binding && binding.compose != null) {
      return binding.compose
    } else if (typeof component.properties[propName] === 'string') {
      return component.properties[propName]
    }

    return null
  }

  changeBinding ({ content, expressions }) {
    const { propName, bindingName, component, onSave } = this.props
    const bindings = component.bindings || {}
    const currentBinding = bindings[bindingName]
    let newBinding
    let newBindings
    let changes

    if (currentBinding) {
      newBinding = {
        ...currentBinding
      }
    } else {
      newBinding = {}
    }

    if (content == null) {
      // editor has removed binding
      delete newBinding.compose
    } else {
      newBinding.compose = {
        content
      }
    }

    if (expressions == null) {
      // editor has removed binding
      delete newBinding.expression
    } else {
      newBinding.expression = Object.keys(expressions).map((exprName) => {
        return exprName
      })
    }

    if (Object.keys(newBinding).length === 0) {
      newBinding = null
    }

    if (newBinding) {
      newBindings = {
        ...bindings,
        [bindingName]: newBinding
      }
    } else {
      newBindings = omit(bindings, [propName, bindingName])
    }

    if (Object.keys(newBindings).length === 0) {
      newBindings = null
    }

    changes = { bindings: newBindings }

    if (expressions === null) {
      changes.expressions = null
    } else if (expressions !== undefined) {
      const currentExpressions = component.expressions || {}

      changes.expressions = {
        ...currentExpressions,
        [bindingName]: expressions
      }
    }

    if (onSave) {
      onSave(changes)
    }
  }

  handleContentChange () {
    const { isDirty } = this.state

    if (!isDirty) {
      this.setState({
        isDirty: true
      })
    }
  }

  handleSave () {
    const { editor, changeBinding } = this
    const contentInEditor = editor.getContentRepresentation()

    changeBinding({
      content: contentInEditor.content,
      expressions: contentInEditor.expressions
    })
  }

  handleRemove () {
    const { changeBinding } = this

    changeBinding({
      content: null,
      expressions: null
    })
  }

  render () {
    const { isDirty } = this.state
    const { componentType, propName, bindingName, component, options, onClose } = this.props

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
          Binding Editor - {`${componentType} (property: ${propName}${isDirty ? '*' : ''})`}
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
            ref={this.setEditorRef}
            initialContent={this.getInitialContent()}
            dataFields={options.dataFields}
            allowedDataExpressionTypes={options.allowedDataExpressionTypes}
            allowFirstLevelArrayProperties={options.allowFirstLevelArrayProperties}
            expressions={component.expressions ? component.expressions[bindingName] : undefined}
            onContentChange={this.handleContentChange}
          />
        </div>
        <br />
        <button onClick={this.handleSave}>Save</button>
        <button onClick={this.handleRemove}>Remove binding</button>
        {' '}
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}

ComposeTextBindingEditor.propTypes = {
  componentType: PropTypes.string.isRequired,
  propName: PropTypes.string.isRequired,
  bindingName: PropTypes.string.isRequired,
  binding: PropTypes.object,
  component: PropTypes.object.isRequired,
  options: PropTypes.object,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default ComposeTextBindingEditor
