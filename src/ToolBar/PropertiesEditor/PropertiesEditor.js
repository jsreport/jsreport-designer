import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import PropertyControl from './PropertyControl'
import BindToDataEditor from './BindToDataEditor'
import './PropertiesEditor.css'

class PropertiesEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      editedProperties: {
        ...props.properties
      },
      bindToDataEditor: null
    }

    this.handleBindToDataClick = this.handleBindToDataClick.bind(this)
    this.handleBindToDataEditorSave = this.handleBindToDataEditorSave.bind(this)
    this.handleBindToDataEditorClose = this.handleBindToDataEditorClose.bind(this)
    this.handlePropertyChange = this.handlePropertyChange.bind(this)
  }

  handleBindToDataClick ({ componentType, propName }) {
    const editedProperties = this.state.editedProperties

    if (!this.state.bindToDataEditor) {
      let stateToUpdate = {
        bindToDataEditor: {
          componentType,
          propName
        }
      }

      if (typeof editedProperties[propName] === 'object' && editedProperties[propName].bindedToData) {
        stateToUpdate.bindToDataEditor.selectedField = {
          expression: editedProperties[propName].expression
        }
      }

      this.setState(stateToUpdate)
    } else {
      this.setState({
        bindToDataEditor: null
      })
    }
  }

  handleBindToDataEditorSave (fieldSelection) {
    const { onChange } = this.props
    let currentFieldValue = this.state.editedProperties[fieldSelection.propName]
    let currentFieldHasBindedValue = typeof currentFieldValue === 'object' && currentFieldValue.bindedToData
    let newEditedProperties
    let stateToUpdate

    stateToUpdate = {
      bindToDataEditor: null
    }

    if (fieldSelection.selectedField != null) {
      newEditedProperties = {
        ...this.state.editedProperties,
        [fieldSelection.propName]: {
          bindedToData: true,
          expression: fieldSelection.selectedField.expression
        }
      }
    } else if (fieldSelection.selectedField == null && currentFieldHasBindedValue) {
      newEditedProperties = {
        ...this.state.editedProperties,
        [fieldSelection.propName]: ''
      }
    }

    if (newEditedProperties) {
      stateToUpdate.editedProperties = newEditedProperties
      onChange(stateToUpdate.editedProperties)
    }

    this.setState(stateToUpdate)
  }

  handleBindToDataEditorClose () {
    this.setState({
      bindToDataEditor: null
    })
  }

  handlePropertyChange ({ propName, value }) {
    const { type, onChange } = this.props
    let valid = true

    this.setState((prevState) => {
      let newProps = {
        ...prevState.editedProperties,
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

      onChange(newProps)

      return {
        editedProperties: newProps
      }
    })
  }

  render () {
    const { bindToDataEditor } = this.state

    const {
      type,
      dataInput,
      properties
    } = this.props

    return (
      <div className="PropertiesEditor">
        <div className="PropertiesEditor-content">
          <h3 className="PropertiesEditor-title">{type}</h3>
          <hr className="PropertiesEditor-separator" />
          {Object.keys(properties).map((propName) => {
            return (
              <PropertyControl
                key={propName}
                componentType={type}
                name={propName}
                value={this.state.editedProperties[propName]}
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
            componentType={bindToDataEditor.componentType}
            propName={bindToDataEditor.propName}
            defaultSelectedField={bindToDataEditor.selectedField}
            onSave={this.handleBindToDataEditorSave}
            onClose={this.handleBindToDataEditorClose}
          />
        )}
      </div>
    )
  }
}

PropertiesEditor.propTypes = {
  type: PropTypes.string.isRequired,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  properties: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export default PropertiesEditor
