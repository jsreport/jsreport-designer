import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import omit from 'lodash/omit'
import Button from '../Button'
import PropertyControl from './PropertyControl'
import TemplateEditor from './TemplateEditor'
import RichContentEditor from './RichContentEditor'
import BindToDataEditor from './BindToDataEditor'
import './ComponentEditor.css'

class ComponentEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      editComponentTemplate: null,
      bindToDataEditor: null,
      richContentEditor: null
    }

    this.handleEditComponentTemplateClick = this.handleEditComponentTemplateClick.bind(this)
    this.handleBindToDataClick = this.handleBindToDataClick.bind(this)
    this.handleEditRichContentClick = this.handleEditRichContentClick.bind(this)
    this.handleTemplateEditorSave = this.handleTemplateEditorSave.bind(this)
    this.handleBindToDataEditorSave = this.handleBindToDataEditorSave.bind(this)
    this.handleEditRichContentSave = this.handleEditRichContentSave.bind(this)
    this.handleTemplateEditorClose = this.handleTemplateEditorClose.bind(this)
    this.handleBindToDataEditorClose = this.handleBindToDataEditorClose.bind(this)
    this.handleEditRichContentClose = this.handleEditRichContentClose.bind(this)
    this.handlePropertyChange = this.handlePropertyChange.bind(this)
  }

  handleEditComponentTemplateClick () {
    if (!this.state.editComponentTemplate) {
      this.setState({
        editComponentTemplate: true
      })
    } else {
      this.setState({
        editComponentTemplate: null
      })
    }
  }

  handleBindToDataClick ({ propName }) {
    let bindings = this.props.bindings || {}

    if (!this.state.bindToDataEditor) {
      let stateToUpdate = {
        bindToDataEditor: {
          propName
        }
      }

      if (bindings[propName] && bindings[propName].defaultExpression != null) {
        stateToUpdate.bindToDataEditor.selectedField = {
          expression: bindings[propName].defaultExpression
        }
      }

      this.setState(stateToUpdate)
    } else {
      this.setState({
        bindToDataEditor: null
      })
    }
  }

  handleEditRichContentClick ({ componentType, propName }) {
    let properties = this.props.properties
    let bindings = this.props.bindings || {}

    if (!this.state.richContentEditor) {
      let currentBinding = bindings[propName]
      let currentContent

      if (currentBinding && currentBinding.richContent != null) {
        currentContent = currentBinding.richContent.content
      } else if (typeof properties[propName] === 'string') {
        currentContent = properties[propName]
      }

      this.setState({
        richContentEditor: {
          propName,
          content: currentContent
        }
      })
    } else {
      this.setState({
        richContentEditor: null
      })
    }
  }

  handleTemplateEditorSave (template) {
    const { onChange } = this.props

    onChange({ template })

    this.setState({
      editComponentTemplate: null
    })
  }

  handleEditRichContentSave ({ propName, rawContent, html }) {
    const { onChange } = this.props
    let bindings = this.props.bindings || {}
    let currentBinding = bindings[propName]
    let newBinding
    let newBindings

    if (currentBinding) {
      newBinding = {
        ...currentBinding
      }
    } else {
      newBinding = {}
    }

    if (rawContent == null) {
      // editor has removed rich content
      delete newBinding.richContent

      if (Object.keys(newBinding).length === 0) {
        newBinding = null
      }
    } else {
      newBinding.richContent = {
        content: rawContent,
        html: html
      }
    }

    if (newBinding) {
      newBindings = {
        ...bindings,
        [propName]: newBinding
      }
    } else {
      newBindings = omit(bindings, [propName])

      if (Object.keys(newBindings).length === 0) {
        newBindings = null
      }
    }


    onChange({ bindings: newBindings })

    this.setState({
      richContentEditor: null
    })
  }

  handleBindToDataEditorSave (fieldSelection) {
    const { onChange } = this.props
    let bindings = this.props.bindings || {}
    let currentBinding = bindings[fieldSelection.propName]
    let currentFieldHasBindedValue = false
    let newBinding
    let newBindings

    if (currentBinding) {
      newBinding = {
        ...currentBinding
      }
    } else {
      newBinding = {}
    }

    if (
      bindings &&
      bindings[fieldSelection.propName] &&
      bindings[fieldSelection.propName].defaultExpression != null &&
      bindings[fieldSelection.propName].defaultExpression !== ''
    ) {
      currentFieldHasBindedValue = true
    }

    if (fieldSelection.selectedField != null) {
      newBinding.defaultExpression = fieldSelection.selectedField.expression

      newBindings = {
        ...bindings,
        [fieldSelection.propName]: newBinding
      }
    } else if (fieldSelection.selectedField == null && currentFieldHasBindedValue) {
      delete newBinding.defaultExpression

      if (Object.keys(newBinding).length === 0) {
        newBinding = null
      }

      if (newBinding) {
        newBindings = {
          ...bindings,
          [fieldSelection.propName]: newBinding
        }
      } else {
        newBindings = omit(bindings, [fieldSelection.propName])

        if (Object.keys(newBindings).length === 0) {
          newBindings = null
        }
      }
    }

    if (newBindings !== undefined) {
      onChange({ bindings: newBindings })
    }

    this.setState({
      bindToDataEditor: null
    })
  }

  handleBindToDataEditorClose () {
    this.setState({
      bindToDataEditor: null
    })
  }

  handleTemplateEditorClose () {
    this.setState({
      editComponentTemplate: null
    })
  }

  handleEditRichContentClose () {
    this.setState({
      richContentEditor: null
    })
  }

  handlePropertyChange ({ propName, value }) {
    const { type, onChange, properties } = this.props
    let valid = true

    let newProps = {
      ...properties,
      [propName]: value
    }

    if (type === 'Image' && (propName === 'width' || propName === 'height')) {
      valid = value != null && !isNaN(value)

      if (valid) {
        newProps[propName] = value !== '' ? Number(value) : 0
      }
    }

    if (!valid) {
      return
    }

    onChange({ props: newProps })
  }

  render () {
    const { bindToDataEditor, richContentEditor, editComponentTemplate } = this.state

    const {
      type,
      dataInput,
      template,
      properties,
      bindings
    } = this.props

    return (
      <div className="ComponentEditor">
        <div className="ComponentEditor-content">
          <h3 className="ComponentEditor-title">{type}</h3>
          <hr className="ComponentEditor-separator" />
          <div className="ComponentEditor-options">
            <Button
              title="Edit component template"
              titlePosition="bottom"
              icon="code"
              onClick={this.handleEditComponentTemplateClick}
            />
          </div>
          {Object.keys(properties).map((propName) => {
            return (
              <PropertyControl
                key={propName}
                componentType={type}
                name={propName}
                binding={bindings ? bindings[propName] : null}
                value={properties[propName]}
                bindToData={dataInput == null ? 'disabled' : null}
                onBindToDataClick={this.handleBindToDataClick}
                onEditRichContentClick={this.handleEditRichContentClick}
                onChange={this.handlePropertyChange}
              />
            )
          })}
        </div>
        {bindToDataEditor && (
          <BindToDataEditor
            dataInput={dataInput}
            componentType={type}
            propName={bindToDataEditor.propName}
            defaultSelectedField={bindToDataEditor.selectedField}
            onSave={this.handleBindToDataEditorSave}
            onClose={this.handleBindToDataEditorClose}
          />
        )}
        {richContentEditor && (
          <RichContentEditor
            componentType={type}
            propName={richContentEditor.propName}
            initialContent={richContentEditor.content}
            onSave={this.handleEditRichContentSave}
            onRemove={this.handleEditRichContentSave}
            onClose={this.handleEditRichContentClose}
          />
        )}
        {editComponentTemplate && (
          <TemplateEditor
            componentType={type}
            template={template}
            onSave={this.handleTemplateEditorSave}
            onClose={this.handleTemplateEditorClose}
          />
        )}
      </div>
    )
  }
}

ComponentEditor.propTypes = {
  type: PropTypes.string.isRequired,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  template: PropTypes.string,
  properties: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  onChange: PropTypes.func.isRequired
}

export default ComponentEditor
