import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject } from 'mobx-react'
import styles from './SelectDataFieldEditor.scss'

@inject((injected, props) => {
  let dataProperties
  let fieldsMeta = injected.dataInputStore.fieldsMeta

  if (props.dataProperties != null) {
    // if custom dataProperties are specified take it from it
    dataProperties = props.dataProperties
    fieldsMeta = injected.dataInputStore.getFieldsMeta({ dataFields: props.dataProperties })
  } else {
    // otherwise take it from the global store
    dataProperties = injected.dataInputStore.valueProperties ? injected.dataInputStore.valueProperties : null
  }

  return {
    dataProperties,
    computedFields: injected.dataInputStore.computedFields,
    fieldsMeta,
    getExpressionName: injected.dataInputStore.getExpressionName,
    getFullExpressionName: injected.dataInputStore.getFullExpressionName
  }
})
@observer
class SelectDataFieldEditor extends Component {
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

  select ({ expression, fieldType, id }) {
    const { getExpressionName } = this.props
    let isSimple = true

    let selection = {
      expression: [
        ...expression
      ]
    }

    if (id != null || fieldType === 'root') {
      selection.expression.push(getExpressionName(fieldType, id))
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

  renderFieldCollection ({
    rootType,
    key,
    expression,
    field,
    computedFields,
    leftSpace,
    collapsed
  }) {
    const { getExpressionName, getFullExpressionName } = this.props
    let allowedTypes = this.props.allowedTypes
    let fullExpression = getFullExpressionName(expression)
    let padding = 1
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
      selectedFullExpression = getFullExpressionName(this.state.selectedField.expression)
    }

    isFieldSelected = (selectedFullExpression != null && selectedFullExpression === fullExpression)

    return (
      [
        <ul key="data-input-fields" className={styles.bindToDataEditorFieldContainer}>
          <li
            key="field-name"
            className={`${styles.bindToDataEditorFieldHeader} ${styles.bindToDataEditorFieldItem} ${isFieldSelected ? styles.selected : ''}`}
            onClick={() => !isFieldDisabled && this.select({
              expression,
              fieldType: expression.length > 0 ? 'property' : 'root',
            })}
          >
            <div style={{ padding: `0 ${leftSpace}rem` }}>
              <span
                className={'fa fa-' + (this.state.fieldCollapse[key] ? 'plus-square' : 'minus-square')}
                onClick={(ev) => { ev.stopPropagation(); this.collapse(key); }}
              />
              {' '}
              <span className={`${styles.bindToDataEditorFieldItemLabel} ${isFieldDisabled ? styles.disabled : ''}`}>
                {`${expression.length === 0 ? '(Data input fields)' : ''} ${field.key != null ? field.key + ' ' : ''}(${field.type})`}
              </span>
            </div>
          </li>
          {/* for now, selecting indexes is disabled, until we figure out a simple way (less technical) for users to select these fields */}
          {false && Array.isArray(field.indexes) && (
            <div
              key="field-indexes"
              className={`${bindToDataEditorFieldIndexes} ${collapsed ? styles.collapsed : ''}`}
            >
              <div
                key="field-indexes-title"
                className={styles.bindToDataEditorFieldHeader}
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
                className={`${bindToDataEditorFieldIndexes} ${this.state.fieldCollapse[key + '__indexes'] ? styles.collapsed : ''}`}
              >
                {field.indexes.map((indexItem) => {
                  let indexKey = `${key}--${indexItem[0]}--field`
                  let indexId = indexItem[0]
                  let indexType = indexItem[1]
                  let fieldType = 'index'

                  let indexIsSelected = (
                    selectedFullExpression != null &&
                    selectedFullExpression === getFullExpressionName(fullExpression, fieldType, indexId)
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
                        className={`${bindToDataEditorFieldItem} ${indexIsSelected ? styles.selected : ''}`}
                        onClick={() => !indexIsDisabled && this.select({
                          expression,
                          fieldType,
                          id: indexId
                        })}
                      >
                        <span
                          className={`${bindToDataEditorFieldItemLabel} ${indexIsDisabled ? styles.disabled : ''}`}
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
              className={`${styles.bindToDataEditorFieldProperties} ${collapsed ? styles.collapsed : ''}`}
            >
              {field.type === 'array' && (
                <div
                  key="field-properties-title"
                  className={styles.bindToDataEditorFieldHeader}
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
                className={`${styles.bindToDataEditorFieldProperties} ${this.state.fieldCollapse[key + '__properties'] ? styles.collapsed : ''}`}
              >
                {field.properties.map((innerField) => {
                  const isSimpleField = Array.isArray(innerField)
                  const innerFieldKey = key + '--' + (isSimpleField ? innerField[0] : innerField.key) + '--field'
                  const innerFieldType = isSimpleField ? innerField[1] : innerField.type
                  const innerFieldId = isSimpleField ? innerField[0] : innerField.key
                  const fieldType = 'property'

                  const innerIsSelected = (
                    selectedFullExpression != null &&
                    selectedFullExpression === getFullExpressionName(fullExpression, fieldType, innerFieldId)
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
                          className={`${styles.bindToDataEditorFieldItem} ${innerIsSelected ? styles.selected : ''}`}
                          onClick={() => !innerIsDisabled && this.select({
                            expression,
                            fieldType,
                            id: innerFieldId
                          })}
                        >
                          <span
                            className={`${styles.bindToDataEditorFieldItemLabel} ${innerIsDisabled ? styles.disabled : ''}`}
                            style={{ padding: `0 ${(padding * (field.type === 'array' ? 3 : 2)) + leftSpace}rem` }}
                          >
                            {`${innerFieldId} (${innerFieldType})`}
                          </span>
                        </div>
                      ) : (
                        this.renderFieldCollection({
                          rootType,
                          key: innerFieldKey,
                          expression: [...expression, getExpressionName(fieldType, innerFieldId)],
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
        </ul>,
        computedFields ? (
          <ul key="computed-fields" className={styles.bindToDataEditorFieldContainer}>
            <div
              key="field-computed-fields"
              className={styles.bindToDataEditorFieldProperties}
            >
              <div
                key="field-computed-fields-title"
                className={styles.bindToDataEditorFieldHeader}
                style={{ padding: `0 ${leftSpace}rem` }}
                onClick={(ev) => { ev.stopPropagation(); this.collapse(key + '__computed_fields'); }}
              >
                <span
                  className={'fa fa-' + (this.state.fieldCollapse[key + '__computed_fields'] ? 'plus-square' : 'minus-square')}
                />
                {' '}
                <span style={{ fontStyle: 'normal' }}>
                  {'(Computed fields)'}
                </span>
              </div>
              <div
                key="field-computed-fields-content"
                className={`${styles.bindToDataEditorFieldProperties} ${this.state.fieldCollapse[key + '__computed_fields'] ? styles.collapsed : ''}`}
              >
                {computedFields.map((field) => {
                  const computedName = field.name
                  const innerFieldKey = `${key}--${computedName}--computed-value`
                  const fieldType = 'computed'
                  const innerFieldType = fieldType
                  const innerFieldId = computedName

                  const innerIsSelected = (
                    selectedFullExpression != null &&
                    selectedFullExpression === getFullExpressionName(fullExpression, fieldType, innerFieldId)
                  )

                  // computed fields are always enabled to select
                  return (
                    <li key={innerFieldKey}>
                      <div
                        className={`${styles.bindToDataEditorFieldItem} ${innerIsSelected ? styles.selected : ''}`}
                        onClick={() => this.select({
                          expression,
                          fieldType,
                          id: innerFieldId
                        })}
                      >
                        <span
                          className={styles.bindToDataEditorFieldItemLabel}
                          style={{ padding: `0 ${(padding * 2) + leftSpace}rem` }}
                        >
                          {`${innerFieldId}`}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </div>
            </div>
          </ul>
        ) : undefined
      ]
    )
  }

  renderDataInput () {
    const { dataProperties, computedFields } = this.props
    let rootKey = '___root___'

    return this.renderFieldCollection({
      rootType: dataProperties.type,
      key: rootKey,
      expression: [],
      field: dataProperties,
      computedFields: computedFields,
      leftSpace: 0,
      collapsed: this.state.fieldCollapse[rootKey]
    })
  }

  render () {
    const { isDirty, selectedField } = this.state
    const { componentType, propName, fieldsMeta, getFullExpressionName, onClose } = this.props
    let selectedFieldMeta

    if (selectedField && fieldsMeta) {
      selectedFieldMeta = fieldsMeta[getFullExpressionName(selectedField.expression)]
    }

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
          Select Data field Editor - {`${componentType} (property: ${propName}${isDirty ? '*' : ''})`}
        </h3>
        <br />
        <div style={{ fontSize: '0.7rem' }}>
          Select a field to bind
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
        {selectedFieldMeta && (
          <div>
            <b>Selected field:</b>
            {' '}
            <i>
              {selectedFieldMeta.fullId}
              {' '}
              {selectedFieldMeta.dataProperties ? `(${selectedFieldMeta.dataProperties.type})` : `(${selectedFieldMeta.fieldType})`}
            </i>
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

SelectDataFieldEditor.propTypes = {
  dataProperties: PropTypes.object,
  componentType: PropTypes.string.isRequired,
  propName: PropTypes.string.isRequired,
  bindingName: PropTypes.string,
  defaultSelectedField: PropTypes.object,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default SelectDataFieldEditor
