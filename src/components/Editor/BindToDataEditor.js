import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject } from 'mobx-react'
import './BindToDataEditor.css'

@inject((injected, props) => {
  let dataProperties

  if (props.dataProperties != null) {
    // if custom dataProperties are specified take it from it
    dataProperties = props.dataProperties
  } else {
    // otherwise take it from the global store
    dataProperties = injected.dataInputStore.value ? injected.dataInputStore.value.parsedProperties : null
  }

  return {
    dataProperties
  }
})
@observer
class BindToDataEditor extends Component {
  constructor (props) {
    super(props)

    let initialState = {
      isDirty: false,
      selectedField: props.defaultSelectedField != null ? props.defaultSelectedField : null,
      fieldCollapse: {}
    }

    // TODO: detect also when the selectedField expression is not available
    // (probably because main dataProperties has changed), in that case the editor is dirty
    if (
      initialState.selectedField != null &&
      props.dataProperties == null
    ) {
      initialState.isDirty = true
      initialState.selectedField = null
    }

    this.state = initialState

    this.getShortFieldTypeName = this.getShortFieldTypeName.bind(this)
    this.getExpressionName = this.getExpressionName.bind(this)
    this.getFullExpressionName = this.getFullExpressionName.bind(this)
    this.select = this.select.bind(this)
    this.collapse = this.collapse.bind(this)
    this.handleUnselect = this.handleUnselect.bind(this)
    this.handleSave = this.handleSave.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    // TODO: detect also when the selectedField expression is not available
    // (probably because main dataProperties has changed), in that case the editor is dirty
    if (
      this.props.dataProperties !== nextProps.dataProperties &&
      this.state.selectedField != null &&
      nextProps.dataProperties == null
    ) {
      this.setState({
        isDirty: true,
        selectedField: null
      })
    }
  }

  getShortFieldTypeName (fieldType) {
    let name

    if (fieldType === 'property') {
      name = 'p'
    } else if (fieldType === 'index') {
      name = 'i'
    } else if (fieldType === 'root') {
      name = ''
    } else {
      throw new Error(`Invalid field type [${fieldType}] in selection`)
    }

    return name
  }

  getExpressionName (fieldType, id) {
    let shortFieldTypeName = this.getShortFieldTypeName(fieldType)

    if (shortFieldTypeName === '') {
      return ''
    }

    return `${shortFieldTypeName}:${id}`
  }

  getFullExpressionName (expression, fieldType, id) {
    let fullExpression
    let separator = '.'

    if (Array.isArray(expression)) {
      fullExpression = expression.join(separator)
    } else {
      fullExpression = expression
    }

    if (fieldType == null || id == null) {
      return fullExpression
    }

    if (fullExpression === '') {
      return `${this.getExpressionName(fieldType, id)}`
    }

    return `${fullExpression}${separator}${this.getExpressionName(fieldType, id)}`
  }

  select ({ field, idParts, fieldType, expression, id }) {
    let isSimple = true

    let selection = {
      expression: [
        ...expression
      ],
      meta: {
        fieldType
      }
    }

    if (id != null || fieldType === 'root') {
      selection.expression.push(this.getExpressionName(fieldType, id))
    }

    if (id != null) {
      selection.meta.fullId = [...idParts, id]
    } else {
      selection.meta.fullId = idParts
    }

    selection.meta.fullId = selection.meta.fullId.join('.')

    selection.meta.dataProperties = {}

    if (Array.isArray(field)) {
      selection.meta.dataProperties.type = field[1]
    } else {
      isSimple = false
      selection.meta.dataProperties.type = field.type
    }

    if (!isSimple) {
      if (field.properties != null) {
        selection.meta.dataProperties.properties = field.properties
      }

      if (field.indexes != null) {
        selection.meta.dataProperties.indexes = field.indexes
      }
    }

    if (Object.keys(selection.meta.dataProperties).length === 0) {
      delete selection.meta.dataProperties
    }

    this.setState({
      isDirty: true,
      selectedField: selection
    })
  }

  collapse (key) {
    this.setState({
      fieldCollapse: {
        ...this.state.fieldCollapse,
        [key]: !this.state.fieldCollapse[key]
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
        bindingName: this.props.bindingName,
        selectedField: this.state.selectedField
      })
    }
  }

  renderFieldCollection ({ idParts, rootType, key, expression, field, leftSpace, collapsed }) {
    let padding = 1
    let fullExpression = this.getFullExpressionName(expression)
    let allowedTypes = this.props.allowedTypes
    let rootIsArray = rootType === 'array'

    let isFieldDisabled

    if (!field || Object.keys(field).length === 0) {
      return (
        <div style={{ textAlign: 'center' }}>
          <span>No data properties available</span>
        </div>
      )
    }

    if (allowedTypes.indexOf('complex') !== -1) {
      isFieldDisabled = (
        field.type !== 'array' &&
        field.type !== 'object'
      )
    } else {
      isFieldDisabled = allowedTypes.indexOf(field.type) === -1
    }

    let selectedFullExpression
    let isFieldSelected

    if (this.state.selectedField) {
      selectedFullExpression = this.getFullExpressionName(this.state.selectedField.expression)
    }

    isFieldSelected = (selectedFullExpression != null && selectedFullExpression === fullExpression)

    return (
      <ul className="BindToDataEditor-field-container">
        <li
          key="field-name"
          className={`BindToDataEditor-field-header BindToDataEditor-field-item ${isFieldSelected ? 'selected' : ''}`}
          onClick={() => !isFieldDisabled && this.select({
            field,
            idParts,
            fieldType: expression.length > 0 ? 'property' : 'root' ,
            expression
          })}
        >
          <div style={{ padding: `0 ${leftSpace}rem` }}>
            <span
              className={'fa fa-' + (this.state.fieldCollapse[key] ? 'plus-square' : 'minus-square')}
              onClick={(ev) => { ev.stopPropagation(); this.collapse(key); }}
            />
            {' '}
            <span className={`BindToDataEditor-field-item-label ${isFieldDisabled ? 'disabled' : ''}`}>
              {`${field.key != null ? field.key + ' ' : ''}(${field.type})`}
            </span>
          </div>
        </li>
        {/* for now, selecting indexes is disabled, until we figure out a simple way (less technical) for users to select these fields */}
        {false && Array.isArray(field.indexes) && (
          <div
            key="field-indexes"
            className={`BindToDataEditor-field-indexes ${collapsed ? 'collapsed' : ''}`}
          >
            <div
              key="field-indexes-title"
              className="BindToDataEditor-field-header"
              style={{ padding: `0 ${padding + leftSpace}rem` }}
              onClick={(ev) => { ev.stopPropagation(); this.collapse(key + '__indexes'); }}
            >
              <span
                className={'fa fa-' + (this.state.fieldCollapse[key + '__indexes'] ? 'plus-square' : 'minus-square')}
              />
              {' '}
              <span style={{ color: '#1f87d6' }}>
                {'> Indexes'}
              </span>
            </div>
            <div
              key="field-indexes-content"
              className={`BindToDataEditor-field-indexes ${this.state.fieldCollapse[key + '__indexes'] ? 'collapsed' : ''}`}
            >
              {field.indexes.map((indexItem) => {
                let indexKey = `${key}--${indexItem[0]}--field`
                let indexId = indexItem[0]
                let indexType = indexItem[1]
                let fieldType = 'index'

                let indexIsSelected = (
                  selectedFullExpression != null &&
                  selectedFullExpression === this.getFullExpressionName(fullExpression, fieldType, indexId)
                )

                let indexIsDisabled

                if (allowedTypes.indexOf('scalar') !== -1) {
                  indexIsDisabled = (
                    indexType !== 'string' &&
                    indexType !== 'number' &&
                    indexType !== 'boolean'
                  )
                } else {
                  indexIsDisabled = allowedTypes.indexOf(indexType) === -1
                }

                return (
                  <li key={indexKey}>
                    <div
                      className={`BindToDataEditor-field-item ${indexIsSelected ? 'selected' : ''}`}
                      onClick={() => !indexIsDisabled && this.select({
                        field: indexItem,
                        idParts,
                        fieldType,
                        expression,
                        id: indexId
                      })}
                    >
                      <span
                        className={`BindToDataEditor-field-item-label ${indexIsDisabled ? 'disabled' : ''}`}
                        style={{ padding: `0 ${(padding * 3) + leftSpace}rem` }}
                      >
                        {`${indexItem[0]} (${indexType})`}
                      </span>
                    </div>
                  </li>
                )
              })}
            </div>
          </div>
        )}
        {Array.isArray(field.properties) && (
          <div
            key="field-properties"
            className={`BindToDataEditor-field-properties ${collapsed ? 'collapsed' : ''}`}
          >
            {field.type === 'array' && (
              <div
                key="field-properties-title"
                className="BindToDataEditor-field-header"
                style={{ padding: `0 ${padding  + leftSpace}rem` }}
                onClick={(ev) => { ev.stopPropagation(); this.collapse(key + '__properties'); }}
              >
                <span
                  className={'fa fa-' + (this.state.fieldCollapse[key + '__properties'] ? 'plus-square' : 'minus-square')}
                />
                {' '}
                <span style={{ color: '#1f87d6' }}>
                  {'> Properties'}
                </span>
              </div>
            )}
            <div
              key="field-properties-content"
              className={`BindToDataEditor-field-properties ${this.state.fieldCollapse[key + '__properties'] ? 'collapsed' : ''}`}
            >
              {field.properties.map((innerField) => {
                let isSimpleField = Array.isArray(innerField)
                let innerFieldKey = key + '--' + (isSimpleField ? innerField[0] : innerField.key) + '--field'
                let innerFieldType = isSimpleField ? innerField[1] : innerField.type
                let innerFieldId = isSimpleField ? innerField[0] : innerField.key
                let fieldType = 'property'

                let innerIsSelected = (
                  selectedFullExpression != null &&
                  selectedFullExpression === this.getFullExpressionName(fullExpression, fieldType, innerFieldId)
                )

                let innerIsDisabled

                if (field.type === 'array' && isFieldDisabled && !rootIsArray) {
                  innerIsDisabled = true
                } else {
                  if (allowedTypes.indexOf('scalar') !== -1) {
                    innerIsDisabled = (
                      innerFieldType !== 'string' &&
                      innerFieldType !== 'number' &&
                      innerFieldType !== 'boolean'
                    )
                  } else {
                    innerIsDisabled = allowedTypes.indexOf(innerFieldType) === -1
                  }
                }

                return (
                  <li key={innerFieldKey}>
                    {isSimpleField ? (
                      <div
                        className={`BindToDataEditor-field-item ${innerIsSelected ? 'selected' : ''}`}
                        onClick={() => !innerIsDisabled && this.select({
                          field: innerField,
                          idParts,
                          fieldType,
                          expression,
                          id: innerFieldId
                        })}
                      >
                        <span
                          className={`BindToDataEditor-field-item-label ${innerIsDisabled ? 'disabled' : ''}`}
                          style={{ padding: `0 ${(padding * (field.type === 'array' ? 3 : 2)) + leftSpace}rem` }}
                        >
                          {`${innerFieldId} (${innerFieldType})`}
                        </span>
                      </div>
                    ) : (
                      this.renderFieldCollection({
                        idParts: [...idParts, innerFieldId],
                        rootType,
                        key: innerFieldKey,
                        expression: [...expression, this.getExpressionName(fieldType, innerFieldId)],
                        field: innerField,
                        leftSpace: padding + leftSpace,
                        collapsed: this.state.fieldCollapse[innerFieldKey]
                      })
                    )}
                  </li>
                )
              })}
            </div>
          </div>
        )}
      </ul>
    )
  }

  renderDataInput () {
    const { dataProperties } = this.props
    let rootKey = '___root___'

    return this.renderFieldCollection({
      idParts: [],
      rootType: dataProperties.type,
      key: rootKey,
      expression: [],
      field: dataProperties,
      leftSpace: 0,
      collapsed: this.state.fieldCollapse[rootKey]
    })
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
        <h3 style={{ marginTop: '0.3rem', marginBottom: '0.3rem' }}>
          Bind To Data Editor - {`${componentType} (property: ${propName}${isDirty ? '*' : ''})`}
        </h3>
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
            <b>Selected field:</b> <i>{selectedField.meta.fullId} ({selectedField.meta.dataProperties.type})</i>
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
  dataProperties: PropTypes.object,
  componentType: PropTypes.string.isRequired,
  propName: PropTypes.string.isRequired,
  bindingName: PropTypes.string,
  defaultSelectedField: PropTypes.object,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default BindToDataEditor
