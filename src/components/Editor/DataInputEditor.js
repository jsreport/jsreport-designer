import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject } from 'mobx-react'
import omit from 'lodash/omit'
import debounce from 'lodash/debounce'
import evaluateScript from '../../../shared/evaluateScript'

@inject((injected) => ({
  dataInput: injected.dataInputStore.value,
  computedInput: injected.dataInputStore.computedFieldsValues,
  extractProperties: injected.dataInputStore.extractProperties,
  update: injected.dataInputActions.update
}))
@observer
class DataInputEditor extends Component {
  constructor (props) {
    super(props)

    this.state = {
      dataValue: null,
      computedFieldsValues: null,
      selectedComputedField: null,
      editedComputedFields: {},
      isDirty: false,
      isCreatingComputed: false,
      dataInputError: null,
      newComputedError: null,
      computedValidationError: null
    }

    this.checkData = debounce(
      this.checkData.bind(this),
      400
    )

    this.setDataInputNode = this.setDataInputNode.bind(this)
    this.setNewComputedNameNode = this.setNewComputedNameNode.bind(this)
    this.setComputedFnNode = this.setComputedFnNode.bind(this)
    this.canSave = this.canSave.bind(this)
    this.handleDataInputChange = this.handleDataInputChange.bind(this)
    this.handleAddComputedField = this.handleAddComputedField.bind(this)
    this.handleComputedFieldChange = this.handleComputedFieldChange.bind(this)
    this.handleComputedFieldSave = this.handleComputedFieldSave.bind(this)
    this.handleComputedFieldRemove = this.handleComputedFieldRemove.bind(this)
    this.handleSave = this.handleSave.bind(this)
  }

  componentWillMount () {
    const { dataInput, computedInput } = this.props

    this.setState({
      dataValue: dataInput,
      computedFieldsValues: computedInput
    })
  }

  componentWillReceiveProps (nextProps) {
    // if dataInput or computedInput have changed (after save) set isDirty to false
    if (this.props.dataInput !== nextProps.dataInput || this.props.computedInput !== nextProps.computedInput) {
      this.setState({
        isDirty: false,
        isCreatingComputed: false,
        newComputedError: null
      })
    }
  }

  setDataInputNode (el) {
    this.dataInputNode = el
  }

  setNewComputedNameNode (el) {
    this.newComputedNameNode = el
  }

  setComputedFnNode (el) {
    this.computedFnNode = el
  }

  canSave () {
    const { dataValue, editedComputedFields } = this.state

    return dataValue != null && dataValue.parsedProperties != null && Object.keys(editedComputedFields).length === 0
  }

  checkData () {
    const { dataValue, editedComputedFields } = this.state
    const { extractProperties } = this.props
    let currentDataInput = dataValue || {}
    let jsonText = currentDataInput.json || ''
    let invalidProperties = false
    let jsonObj
    let parsedProperties

    let stateToUpdate = {
      dataValue: { json: jsonText }
    }

    try {
      jsonObj = JSON.parse(jsonText)
    } catch (e) {
      return this.setState({
        ...stateToUpdate,
        dataInputError: `Value entered is not valid json (${e.message})`
      })
    }

    parsedProperties = extractProperties(jsonObj)

    if (
      !parsedProperties ||
      (parsedProperties.type === 'array' &&
      parsedProperties.indexes.length === 0) ||
      (parsedProperties.type === 'object' &&
      parsedProperties.properties.length === 0)
    ) {
      invalidProperties = true
    }

    if (invalidProperties) {
      return this.setState({
        ...stateToUpdate,
        dataInputError: 'JSON value entered has no properties to extract'
      })
    }

    stateToUpdate.dataValue.json = jsonText
    stateToUpdate.dataValue.data = jsonObj
    stateToUpdate.dataValue.parsedProperties = parsedProperties

    this.setState(stateToUpdate)
  }

  handleDataInputChange () {
    const { dataValue } = this.state
    let currentDataInput = dataValue || {}
    let jsonText = this.dataInputNode.value

    let stateToUpdate = {
      dataInputError: null,
      dataValue: {
        ...currentDataInput,
        json: jsonText
      },
      isDirty: true
    }

    this.setState(stateToUpdate)

    this.checkData()
  }

  handleAddComputedField () {
    const { computedFieldsValues } = this.state
    const newComputedName = this.newComputedNameNode.value
    const originalComputedFieldsValues = computedFieldsValues || { source: {}, order: [] }

    if (!newComputedName) {
      return this.setState({
        newComputedError: `computed field with name can't be empty`
      })
    }

    if (originalComputedFieldsValues && originalComputedFieldsValues.source && originalComputedFieldsValues.source[newComputedName]) {
      return this.setState({
        newComputedError: `computed field with name "${newComputedName}" already exists`
      })
    }

    this.setState({
      isDirty: true,
      isCreatingComputed: false,
      newComputedError: null,
      computedFieldsValues: {
        ...originalComputedFieldsValues,
        source: {
          ...originalComputedFieldsValues.source,
          [newComputedName]: 'function (data) {\n  // your logic here..\n  return\n}'
        },
        order: [
          ...originalComputedFieldsValues.order,
          newComputedName
        ]
      }
    })
  }

  handleComputedFieldChange (ev) {
    const { editedComputedFields } = this.state
    const computedFieldName = ev.target.name

    this.setState({
      isDirty: true,
      editedComputedFields: Object.assign({}, editedComputedFields, {
        [computedFieldName]: ev.target.value
      })
    })
  }

  handleComputedFieldSave () {
    const { computedFieldsValues, selectedComputedField, editedComputedFields } = this.state
    const computedFnText = this.computedFnNode.value
    const originalComputedFieldsValues = computedFieldsValues || { source: {}, order: [] }

    try {
      let computedFn = evaluateScript.getSingleExport(computedFnText)

      if (typeof computedFn !== 'function') {
        throw new Error('computed field must export a function')
      }

      this.setState({
        computedValidationError: null,
        editedComputedFields: omit(editedComputedFields, [selectedComputedField]),
        computedFieldsValues: {
          ...originalComputedFieldsValues,
          source: {
            ...originalComputedFieldsValues.source,
            [selectedComputedField]: computedFnText
          }
        }
      })
    } catch (evaluateErr) {
      this.setState({
        computedValidationError: evaluateErr.message
      })
    }
  }

  handleComputedFieldRemove () {
    const { computedFieldsValues, selectedComputedField, editedComputedFields } = this.state
    const originalComputedFieldsValues = computedFieldsValues || { source: {}, order: [] }
    const selectedOrderIndex = originalComputedFieldsValues.order.indexOf(selectedComputedField)

    if (selectedOrderIndex === -1) {
      return
    }

    this.setState({
      isDirty: true,
      selectedComputedField: null,
      editedComputedFields: omit(editedComputedFields, [selectedComputedField]),
      computedValidationError: null,
      computedFieldsValues: {
        ...originalComputedFieldsValues,
        source: omit(originalComputedFieldsValues.source, [selectedComputedField]),
        order: [
          ...originalComputedFieldsValues.order.slice(0, selectedOrderIndex),
          ...originalComputedFieldsValues.order.slice(selectedOrderIndex + 1)
        ]
      }
    })
  }

  handleSave () {
    const { update } = this.props
    let { dataValue, computedFieldsValues } = this.state

    if (this.canSave()) {
      update({
        value: dataValue,
        computedFieldsValues
      })
    }
  }

  render () {
    const {
      dataValue,
      computedFieldsValues,
      selectedComputedField,
      editedComputedFields,
      isDirty,
      isCreatingComputed,
      dataInputError,
      newComputedError,
      computedValidationError
    } = this.state

    const canSave = this.canSave()
    const { dataInput, onClose } = this.props
    let currentValue

    if (dataInput != null && dataValue != null) {
      currentValue = dataValue.json
    } else if (dataInput == null && dataValue) {
      currentValue = dataValue.json
    } else {
      currentValue = ''
    }

    return (
      <div
        style={{
          position: 'fixed',
          bottom: '50px',
          left: '8px',
          zIndex: 100,
          color: '#000',
          backgroundColor: 'yellow',
          padding: '8px',
          width: '350px'
        }}
      >
        <h3 style={{ marginTop: '0.3rem', marginBottom: '0.3rem' }}>
          Data Input{isDirty ? '*' : ''}
        </h3>
        <br />
        <div style={{ fontSize: '0.7rem' }}>
          Paste here the json data which is the input of your jsreport requests
        </div>
        <br />
        <textarea
          ref={this.setDataInputNode}
          style={{ overflow: 'auto', resize: 'none', width: '100%', height: '250px' }}
          rows="25"
          value={currentValue}
          onChange={this.handleDataInputChange}
        />
        <div style={{ color: 'red' }}>{dataInputError || ' '}</div>
        <br />
        <p style={{ fontSize: '0.7rem' }}>
          Create here computed fields based on data input
        </p>
        <div style={{ height: '25px' }}>
          {isCreatingComputed ? (
            <div>
              <input ref={this.setNewComputedNameNode} type="text" placeholder="computed field name" autoFocus />
              {' '}
              <button onClick={this.handleAddComputedField}>Ok</button>
              <button onClick={() => this.setState({ isCreatingComputed: false, newComputedError: null })}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => this.setState({ isCreatingComputed: true })} disabled={!dataValue || dataValue.parsedProperties == null}>Add computed field</button>
          )}
        </div>
        <div style={{ color: 'red' }}>{newComputedError || ' '}</div>
        <div style={{ color: 'red' }}>{computedValidationError || ' '}</div>
        <br />
        <div>
          <div style={{ display: 'inline-block', verticalAlign: 'middle', width: '120px', height: '180px' }}>
            <select
              multiple={true}
              style={{ width: '100%', height: '150px' }}
              value={[selectedComputedField != null ? selectedComputedField : undefined]}
              onChange={(ev) => this.setState({
                selectedComputedField: ev.target.value
              })}
            >
              {computedFieldsValues && computedFieldsValues.source && Object.keys(computedFieldsValues.source).map((computedName) => (
                <option key={computedName} value={computedName}>{computedName}{editedComputedFields[computedName] != null ? '*' : ''}</option>
              ))}
            </select>
            <div style={{ marginTop: '5px', marginRight: '5px' }}>
              <button
                disabled={!selectedComputedField || !computedFieldsValues || Object.keys(computedFieldsValues).length === 0}
                onClick={this.handleComputedFieldRemove}
              >
                Remove
              </button>
            </div>
          </div>
          {selectedComputedField && (
            <div
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginLeft: '10px',
                width: '200px',
                height: '180px'
              }}
            >
              <textarea
                ref={this.setComputedFnNode}
                key={selectedComputedField}
                name={selectedComputedField}
                style={{ overflow: 'auto', resize: 'none', width: '100%', height: '150px' }}
                rows="25"
                defaultValue={editedComputedFields[selectedComputedField] != null ? editedComputedFields[selectedComputedField] : computedFieldsValues.source[selectedComputedField]}
                onChange={this.handleComputedFieldChange}
              />
              <div style={{ marginTop: '5px', marginRight: '5px', textAlign: 'right' }}>
                <button onClick={this.handleComputedFieldSave}>Ok</button>
                {' '}
                <button
                  onClick={(ev) => this.setState({
                    selectedComputedField: null,
                    computedValidationError: null,
                    editedComputedFields: omit(editedComputedFields, [selectedComputedField])
                  })}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <br />
        <br />
        {' '}
        <button onClick={this.handleSave} disabled={!canSave}>Save</button>
        {' '}
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}

DataInputEditor.propTypes = {
  onClose: PropTypes.func
}

export default DataInputEditor
