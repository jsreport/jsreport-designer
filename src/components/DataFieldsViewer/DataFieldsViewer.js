import React, { Component } from 'react'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject } from 'mobx-react'
import styles from './DataFieldsViewer.scss'

@inject((injected, props) => {
  let dataFields
  let fieldsMeta

  if (props.dataFields != null) {
    // if custom dataFields are specified take it from it
    dataFields = props.dataFields
    fieldsMeta = props.fieldsMeta ? props.fieldsMeta : injected.dataInputStore.getFieldsMeta({ dataFields: props.dataFields })
  } else {
    // otherwise take it from the global store
    dataFields = injected.dataInputStore.valueProperties ? injected.dataInputStore.valueProperties : null
    fieldsMeta = injected.dataInputStore.fieldsMeta
  }

  return {
    dataFields,
    computedFields: injected.dataInputStore.computedFields,
    fieldsMeta,
    getDataExpressionName: injected.dataInputStore.getExpressionName,
    getFullDataExpressionName: injected.dataInputStore.getFullExpressionName,
    onSelect: props.onSelect
  }
})
@observer
class DataFieldsViewer extends Component {
  constructor (props) {
    super(props)

    this.state = {
      fieldCollapse: {}
    }

    this.select = this.select.bind(this)
    this.collapse = this.collapse.bind(this)
    this.renderFieldCollection = this.renderFieldCollection.bind(this)
  }

  collapse (key) {
    this.setState({
      fieldCollapse: {
        ...this.state.fieldCollapse,
        [key]: !this.state.fieldCollapse[key]
      }
    })
  }

  select ({ expression, fieldType, id }) {
    const { onSelect, getDataExpressionName, disabled } = this.props

    if (disabled === true) {
      return
    }

    let selectedField = {
      dataExpression: [
        ...expression
      ]
    }

    if (id != null || fieldType === 'root') {
      selectedField.dataExpression.push(getDataExpressionName(fieldType, id))
    }

    if (onSelect) {
      onSelect(selectedField)
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
    const { title, disabled, selectedField, getDataExpressionName, getFullDataExpressionName } = this.props
    const { fieldCollapse } = this.state
    let allowedTypes = this.props.allowedTypes
    let fullExpression = getFullDataExpressionName(expression)
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

    if (selectedField) {
      selectedFullExpression = getFullDataExpressionName(selectedField.dataExpression)
    }

    isFieldSelected = (selectedFullExpression != null && selectedFullExpression === fullExpression)

    return ([
      <ul key='data-input-fields' className={styles.dataFieldsViewerContainer}>
        <li
          key='field-name'
          className={`${styles.dataFieldsViewerHeader} ${disabled === true ? '' : styles.dataFieldsViewerItem} ${isFieldSelected ? styles.selected : ''}`}
          onClick={() => !isFieldDisabled && this.select({
            expression,
            fieldType: expression.length > 0 ? 'property' : 'root'
          })}
        >
          <div style={{ padding: `0 ${leftSpace}rem` }}>
            <span
              className={'fa fa-' + (fieldCollapse[key] ? 'plus-square' : 'minus-square')}
              onClick={(ev) => { ev.stopPropagation(); this.collapse(key) }}
            />
            {' '}
            <span className={`${styles.dataFieldsViewerItemLabel} ${isFieldDisabled ? styles.disabled : ''}`}>
              {`${expression.length === 0 ? `(${title != null ? title : 'Data input fields'})` : ''} ${field.key != null ? field.key + ' ' : ''}(${field.type})`}
            </span>
          </div>
        </li>
        {/* for now, selecting indexes is disabled, until we figure out a simple way (less technical) for users to select these fields */}
        {false && Array.isArray(field.indexes) && (
          <div
            key='field-indexes'
            className={`${styles.dataFieldsViewerIndexes} ${collapsed ? styles.collapsed : ''}`}
          >
            <div
              key='field-indexes-title'
              className={styles.dataFieldsViewerHeader}
              style={{ padding: `0 ${padding + leftSpace}rem` }}
              onClick={(ev) => { ev.stopPropagation(); this.collapse(key + '__indexes') }}
            >
              <span
                className={'fa fa-' + (fieldCollapse[key + '__indexes'] ? 'plus-square' : 'minus-square')}
              />
              {' '}
              <span style={{ color: '#1f87d6' }}>
                {'> Indexes'}
              </span>
            </div>
            <div
              key='field-indexes-content'
              className={`${styles.dataFieldsViewerIndexes} ${fieldCollapse[key + '__indexes'] ? styles.collapsed : ''}`}
            >
              {field.indexes.map((indexItem) => {
                let indexKey = `${key}--${indexItem[0]}--field`
                let indexId = indexItem[0]
                let indexType = indexItem[1]
                let fieldType = 'index'

                let indexIsSelected = (
                  selectedFullExpression != null &&
                  selectedFullExpression === getFullDataExpressionName(fullExpression, fieldType, indexId)
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
                      className={`${disabled === true ? '' : styles.dataFieldsViewerItem} ${indexIsSelected ? styles.selected : ''}`}
                      onClick={() => !indexIsDisabled && this.select({
                        expression,
                        fieldType,
                        id: indexId
                      })}
                    >
                      <span
                        className={`${styles.dataFieldsViewerItemLabel} ${indexIsDisabled ? styles.disabled : ''}`}
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
            key='field-properties'
            className={`${styles.dataFieldsViewerProperties} ${collapsed ? styles.collapsed : ''}`}
          >
            {field.type === 'array' && (
              <div
                key='field-properties-title'
                className={styles.dataFieldsViewerHeader}
                style={{ padding: `0 ${padding + leftSpace}rem` }}
                onClick={(ev) => { ev.stopPropagation(); this.collapse(key + '__properties') }}
              >
                <span
                  className={'fa fa-' + (fieldCollapse[key + '__properties'] ? 'plus-square' : 'minus-square')}
                />
                {' '}
                <span style={{ color: '#1f87d6' }}>
                  {'> Properties'}
                </span>
              </div>
            )}
            <div
              key='field-properties-content'
              className={`${styles.dataFieldsViewerProperties} ${fieldCollapse[key + '__properties'] ? styles.collapsed : ''}`}
            >
              {field.properties.map((innerField) => {
                const isSimpleField = Array.isArray(innerField)
                const innerFieldKey = key + '--' + (isSimpleField ? innerField[0] : innerField.key) + '--field'
                const innerFieldType = isSimpleField ? innerField[1] : innerField.type
                const innerFieldId = isSimpleField ? innerField[0] : innerField.key
                const fieldType = 'property'

                const innerIsSelected = (
                  selectedFullExpression != null &&
                  selectedFullExpression === getFullDataExpressionName(fullExpression, fieldType, innerFieldId)
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
                        className={`${disabled === true ? '' : styles.dataFieldsViewerItem} ${innerIsSelected ? styles.selected : ''}`}
                        onClick={() => !innerIsDisabled && this.select({
                          expression,
                          fieldType,
                          id: innerFieldId
                        })}
                      >
                        <span
                          className={`${styles.dataFieldsViewerItemLabel} ${innerIsDisabled ? styles.disabled : ''}`}
                          style={{ padding: `0 ${(padding * (field.type === 'array' ? 3 : 2)) + leftSpace}rem` }}
                        >
                          {`${innerFieldId} (${innerFieldType})`}
                        </span>
                      </div>
                    ) : (
                      this.renderFieldCollection({
                        rootType,
                        key: innerFieldKey,
                        expression: [...expression, getDataExpressionName(fieldType, innerFieldId)],
                        field: innerField,
                        leftSpace: padding + leftSpace,
                        collapsed: fieldCollapse[innerFieldKey]
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
        <ul key='computed-fields' className={styles.dataFieldsViewerContainer}>
          <div
            key='field-computed-fields'
            className={styles.dataFieldsViewerProperties}
          >
            <div
              key='field-computed-fields-title'
              className={styles.dataFieldsViewerHeader}
              style={{ padding: `0 ${leftSpace}rem` }}
              onClick={(ev) => { ev.stopPropagation(); this.collapse(key + '__computed_fields') }}
            >
              <span
                className={'fa fa-' + (fieldCollapse[key + '__computed_fields'] ? 'plus-square' : 'minus-square')}
              />
              {' '}
              <span style={{ fontStyle: 'normal' }}>
                {'(Computed fields)'}
              </span>
            </div>
            <div
              key='field-computed-fields-content'
              className={`${styles.dataFieldsViewerProperties} ${fieldCollapse[key + '__computed_fields'] ? styles.collapsed : ''}`}
            >
              {computedFields.map((field) => {
                const computedName = field.name
                const innerFieldKey = `${key}--${computedName}--computed-value`
                const fieldType = 'computed'
                const innerFieldType = fieldType
                const innerFieldId = computedName

                const innerIsSelected = (
                  selectedFullExpression != null &&
                  selectedFullExpression === getFullDataExpressionName(fullExpression, innerFieldType, innerFieldId)
                )

                // computed fields are always enabled to select
                return (
                  <li key={innerFieldKey}>
                    <div
                      className={`${disabled === true ? '' : styles.dataFieldsViewerItem} ${innerIsSelected ? styles.selected : ''}`}
                      onClick={() => this.select({
                        expression,
                        fieldType: innerFieldType,
                        id: innerFieldId
                      })}
                    >
                      <span
                        className={styles.dataFieldsViewerItemLabel}
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
    ])
  }

  render () {
    const rootKey = '___root___'
    const renderFieldCollection = this.renderFieldCollection
    const { fieldCollapse } = this.state

    const {
      dataFields,
      computedFields,
      fieldsMeta,
      selectedField,
      getFullDataExpressionName
    } = this.props

    let selectedFieldMeta

    if (selectedField && fieldsMeta) {
      selectedFieldMeta = fieldsMeta[getFullDataExpressionName(selectedField.dataExpression)]
    }

    return (
      <div>
        <div>
          {renderFieldCollection({
            rootType: dataFields.type,
            key: rootKey,
            expression: [],
            field: dataFields,
            computedFields,
            leftSpace: 0,
            collapsed: fieldCollapse[rootKey]
          })}
        </div>
        <br />
        <div>
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
        </div>
      </div>
    )
  }
}

DataFieldsViewer.propTypes = {
  title: PropTypes.string,
  disabled: PropTypes.bool,
  dataFields: PropTypes.object,
  fieldsMeta: PropTypes.object,
  selectedField: PropTypes.object,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func
}

DataFieldsViewer.wrappedComponent.propTypes = {
  title: PropTypes.string,
  disabled: PropTypes.bool,
  dataFields: PropTypes.object,
  fieldsMeta: PropTypes.object,
  computedFields: PropTypes.array,
  selectedField: PropTypes.object,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  getDataExpressionName: PropTypes.func,
  getFullDataExpressionName: PropTypes.func,
  onSelect: PropTypes.func
}

export default DataFieldsViewer
