import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import './BindToDataEditor.css'

class BindToDataEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      isDirty: false,
      selectedField: props.defaultSelectedField != null ? props.defaultSelectedField : null,
      fieldCollapse: {}
    }

    this.select = this.select.bind(this)
    this.collapse = this.collapse.bind(this)
    this.handleUnselect = this.handleUnselect.bind(this)
    this.handleSave = this.handleSave.bind(this)
  }

  select (field) {
    this.setState({
      isDirty: true,
      selectedField: field
    })
  }

  collapse (fieldId) {
    this.setState({
      fieldCollapse: {
        ...this.state.fieldCollapse,
        [fieldId]: !this.state.fieldCollapse[fieldId]
      }
    })
  }

  handleUnselect () {
    this.setState({
      isDirty: true,
      selectedField: null
    })
  }

  handleSave () {
    if (this.props.onSave) {
      this.props.onSave({
        propName: this.props.propName,
        selectedField: this.state.selectedField ? {
          expression: this.state.selectedField.expression
        } : null
      })
    }
  }

  renderFieldCollection (fieldId, fieldFullName, field, level, collapsed) {
    let padding = 0.5

    return (
      <ul className="BindToDataEditor-field-container">
        <li key="field-name" className="BindToDataEditor-field-header" onClick={() => this.collapse(fieldId)}>
          <div style={{ padding: `0 ${padding * level}rem` }}>
            <span className={'fa fa-' + (this.state.fieldCollapse[fieldId] ? 'plus-square' : 'minus-square')} />
            {' '}
            <span>{`${field.key != null ? field.key + ' ' : ''}(${field.type})`}</span>
          </div>
        </li>
        <div key="field-properties" className={'BindToDataEditor-field-properties ' + (collapsed ? 'collapsed' : '')}>
          {Array.isArray(field.properties) ? (
            field.properties.map((innerField) => {
              let isSimpleField = typeof innerField === 'string'
              let innerFieldId = fieldId + '--' + (isSimpleField ? innerField : innerField.key) + '--field'
              let innerFieldFullName = (fieldFullName == null ? '' : fieldFullName + '.') + (isSimpleField ? innerField : innerField.key)
              let innerIsSelected = (this.state.selectedField && this.state.selectedField.expression === innerFieldFullName)

              return (
                <li key={innerFieldId}>
                  {isSimpleField ? (
                    <div
                      className={'BindToDataEditor-field-item ' + (innerIsSelected ? 'selected' : '')}
                      onClick={() => this.select({ expression: innerFieldFullName })}
                    >
                      <span style={{ padding: `0 ${(padding * level) + 1.2}rem` }}>{innerField}</span>
                    </div>
                  ) : (
                    this.renderFieldCollection(
                      innerFieldId,
                      innerFieldFullName,
                      innerField,
                      level + 1,
                      this.state.fieldCollapse[innerFieldId]
                    )
                  )}
                </li>
              )
            })
          ) : null}
        </div>
      </ul>
    )
  }

  renderDataInput () {
    const { dataInput } = this.props
    let rootId = '___root___'

    return this.renderFieldCollection(
      rootId,
      null,
      dataInput.parsedProperties,
      1,
      this.state.fieldCollapse[rootId]
    )
  }

  render () {
    const { isDirty, selectedField } = this.state
    const { componentType, propName, onClose } = this.props

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
          width: '350px'
        }}
      >
        <h3 style={{ marginTop: '0.3rem', marginBottom: '0.3rem' }}>Bind To Data Editor - {`${componentType} (property: ${propName}${isDirty ? '*' : ''})`}</h3>
        <br />
        <div style={{ fontSize: '0.7rem' }}>
          Select the data field to bind
        </div>
        <div style={{
          marginTop: '0.6rem',
          marginBottom: '0.6rem',
          border: '1px solid black',
          overflow: 'auto'
        }}
        >
          {this.renderDataInput()}
        </div>
        <br />
        {selectedField && (
          <div>
            Selected field: {selectedField.expression}
          </div>
        )}
        <br />
        <button onClick={this.handleSave}>Save</button>
        {' '}
        <button disabled={selectedField == null} onClick={this.handleUnselect}>Unbind</button>
        {' '}
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}

BindToDataEditor.propTypes = {
  dataInput: PropTypes.object.isRequired,
  componentType: PropTypes.string.isRequired,
  propName: PropTypes.string.isRequired,
  defaultSelectedField: PropTypes.object,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default BindToDataEditor
