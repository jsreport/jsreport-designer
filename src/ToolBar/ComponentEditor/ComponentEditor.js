import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../Button'
import PropertyControl from './PropertyControl'
import TemplateEditor from './TemplateEditor'
import BindToDataEditor from './BindToDataEditor'
import './ComponentEditor.css'

class ComponentEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      editComponentTemplate: null,
      bindToDataEditor: null
    }

    this.handleEditComponentTemplateClick = this.handleEditComponentTemplateClick.bind(this)
    this.handleBindToDataClick = this.handleBindToDataClick.bind(this)
    this.handleTemplateEditorSave = this.handleTemplateEditorSave.bind(this)
    this.handleBindToDataEditorSave = this.handleBindToDataEditorSave.bind(this)
    this.handleTemplateEditorClose = this.handleTemplateEditorClose.bind(this)
    this.handleBindToDataEditorClose = this.handleBindToDataEditorClose.bind(this)
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

  handleBindToDataClick ({ componentType, propName }) {
    const properties = this.props.properties

    if (!this.state.bindToDataEditor) {
      let stateToUpdate = {
        bindToDataEditor: {
          propName
        }
      }

      if (typeof properties[propName] === 'object' && properties[propName].bindedToData) {
        stateToUpdate.bindToDataEditor.selectedField = {
          expression: properties[propName].expression
        }
      }

      this.setState(stateToUpdate)
    } else {
      this.setState({
        bindToDataEditor: null
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

  handleBindToDataEditorSave (fieldSelection) {
    const { onChange, properties } = this.props
    let currentFieldValue = properties[fieldSelection.propName]
    let currentFieldHasBindedValue = typeof currentFieldValue === 'object' && currentFieldValue.bindedToData
    let newEditedProperties

    if (fieldSelection.selectedField != null) {
      newEditedProperties = {
        ...properties,
        [fieldSelection.propName]: {
          bindedToData: true,
          expression: fieldSelection.selectedField.expression
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
    const { bindToDataEditor, editComponentTemplate } = this.state

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
