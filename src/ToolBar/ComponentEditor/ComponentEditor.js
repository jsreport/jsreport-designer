import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
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
    const properties = this.props.properties

    if (!this.state.bindToDataEditor) {
      let stateToUpdate = {
        bindToDataEditor: {
          propName
        }
      }

      if (typeof properties[propName] === 'object' && properties[propName].bindedToData) {
        stateToUpdate.bindToDataEditor.selectedField = {
          expression: properties[propName].bindedToData.expression
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
    if (!this.state.richContentEditor) {
      let currentContent = this.props.properties[propName]

      if (typeof currentContent === 'object' && currentContent.richContent != null) {
        currentContent = currentContent.richContent.content
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
    const { onChange, properties } = this.props
    let currentValue = properties[propName]
    let newEditedProperties

    if (typeof currentValue === 'object') {
      currentValue = {
        ...currentValue
      }
    } else {
      currentValue = {}
    }

    currentValue.richContent = {
      content: rawContent,
      html: html
    }

    newEditedProperties = {
      ...properties,
      [propName]: currentValue
    }

    onChange({ props: newEditedProperties })

    this.setState({
      richContentEditor: null
    })
  }

  handleBindToDataEditorSave (fieldSelection) {
    const { onChange, properties } = this.props
    let currentFieldValue = properties[fieldSelection.propName]
    let currentFieldHasBindedValue = typeof currentFieldValue === 'object' && currentFieldValue.bindedToData
    let newEditedProperties

    if (fieldSelection.selectedField != null) {
      newEditedProperties = {
        ...properties,
        [fieldSelection.propName]: {
          bindedToData: {
            expression: fieldSelection.selectedField.expression
          }
        }
      }
    } else if (fieldSelection.selectedField == null && currentFieldHasBindedValue) {
      newEditedProperties = {
        ...properties,
        [fieldSelection.propName]: ''
      }
    }

    if (newEditedProperties) {
      onChange({ props: newEditedProperties })
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
      properties
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
  onChange: PropTypes.func.isRequired
}

export default ComponentEditor
