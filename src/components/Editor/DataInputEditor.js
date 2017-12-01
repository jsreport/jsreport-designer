import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject } from 'mobx-react'
import omit from 'lodash/omit'
import debounce from 'lodash/debounce'
import evaluateScript from '../../../shared/evaluateScript'

@inject((injected) => ({
  dataValue: injected.dataInputStore.value,
  dataValueJSON: injected.dataInputStore.valueJSON,
  dataProperties: injected.dataInputStore.valueProperties,
  computedFields: injected.dataInputStore.computedFields,
  computedFieldsMap: injected.dataInputStore.computedFieldsMap,
  extractProperties: injected.dataInputStore.extractProperties,
  update: injected.dataInputActions.update
}))
@observer
class DataInputEditor extends Component {
  constructor (props) {
    super(props)

    this.state = {
      editingData: {},
      editingComputedFields: {},
      selectedComputedField: null,
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

    this.setDataTextNode = this.setDataTextNode.bind(this)
    this.setNewComputedNameNode = this.setNewComputedNameNode.bind(this)
    this.setComputedFnNode = this.setComputedFnNode.bind(this)
    this.canSave = this.canSave.bind(this)
    this.handleDataTextChange = this.handleDataTextChange.bind(this)
    this.handleAddComputedField = this.handleAddComputedField.bind(this)
    this.handleComputedFieldChange = this.handleComputedFieldChange.bind(this)
    this.handleComputedFieldSave = this.handleComputedFieldSave.bind(this)
    this.handleComputedFieldRemove = this.handleComputedFieldRemove.bind(this)
    this.handleSave = this.handleSave.bind(this)
  }

  componentWillMount () {
    const {
      dataValue,
      dataValueJSON,
      dataProperties,
      computedFields,
      computedFieldsMap
    } = this.props

    this.setState({
      editingData: dataValue ? {
        json: dataValueJSON,
        data: dataValue,
        properties: dataProperties
      } : {},
      editingComputedFields: computedFields ? {
        sourceMap: computedFieldsMap,
        order: computedFields.map((field) => field.name),
        updatedSourceMap: {}
      } : { sourceMap: {}, order: [], updatedSourceMap: {} }
    })
  }

  setDataTextNode (el) {
    this.dataTextNode = el
  }

  setNewComputedNameNode (el) {
    this.newComputedNameNode = el
  }

  setComputedFnNode (el) {
    this.computedFnNode = el
  }

  canSave () {
    const { editingData, editingComputedFields } = this.state

    return (
      editingData != null &&
      editingData.properties != null &&
      Object.keys(editingComputedFields.updatedSourceMap).length === 0
    )
  }

  checkData () {
    const { editingData } = this.state
    const { extractProperties } = this.props
    let jsonText = editingData.json || ''
    let invalidProperties = false
    let jsonObj
    let parsedProperties

    let stateToUpdate = {
      editingData: { json: jsonText }
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

    stateToUpdate.editingData.json = jsonText
    stateToUpdate.editingData.data = jsonObj
    stateToUpdate.editingData.properties = parsedProperties

    this.setState(stateToUpdate)
  }

  handleDataTextChange () {
    const { editingData } = this.state
    let jsonText = this.dataTextNode.value

    let stateToUpdate = {
      dataInputError: null,
      editingData: {
        ...editingData,
        json: jsonText
      },
      isDirty: true
    }

    this.setState(stateToUpdate)

    this.checkData()
  }

  handleAddComputedField () {
    const { editingComputedFields } = this.state
    const newComputedName = this.newComputedNameNode.value

    if (!newComputedName) {
      return this.setState({
        newComputedError: `computed field with name can't be empty`
      })
    }

    if (editingComputedFields && editingComputedFields.sourceMap && editingComputedFields.sourceMap[newComputedName]) {
      return this.setState({
        newComputedError: `computed field with name "${newComputedName}" already exists`
      })
    }

    this.setState({
      isDirty: true,
      isCreatingComputed: false,
      newComputedError: null,
      editingComputedFields: {
        ...editingComputedFields,
        sourceMap: {
          ...editingComputedFields.sourceMap,
          [newComputedName]: 'function (data) {\n  // your logic here..\n  return\n}'
        },
        order: [
          ...editingComputedFields.order,
          newComputedName
        ]
      }
    })
  }

  handleComputedFieldChange (ev) {
    const { editingComputedFields } = this.state
    const computedFieldName = ev.target.name

    this.setState({
      isDirty: true,
      editingComputedFields: {
        ...editingComputedFields,
        updatedSourceMap: {
          ...editingComputedFields.updatedSourceMap,
          [computedFieldName]: ev.target.value
        }
      }
    })
  }

  handleComputedFieldSave () {
    const { editingComputedFields, selectedComputedField } = this.state
    const computedFnText = this.computedFnNode.value

    try {
      let computedFn = evaluateScript.getSingleExport(computedFnText)

      if (typeof computedFn !== 'function') {
        throw new Error('computed field must export a function')
      }

      this.setState({
        computedValidationError: null,
        editingComputedFields: {
          ...editingComputedFields,
          sourceMap: {
            ...editingComputedFields.sourceMap,
            [selectedComputedField]: computedFnText
          },
          updatedSourceMap: omit(editingComputedFields.updatedSourceMap, [selectedComputedField])
        }
      })
    } catch (evaluateErr) {
      this.setState({
        computedValidationError: evaluateErr.message
      })
    }
  }

  handleComputedFieldRemove () {
    const { editingComputedFields, selectedComputedField } = this.state
    const selectedOrderIndex = editingComputedFields.order.indexOf(selectedComputedField)

    if (selectedOrderIndex === -1) {
      return
    }

    this.setState({
      isDirty: true,
      selectedComputedField: null,
      computedValidationError: null,
      editingComputedFields: {
        ...editingComputedFields,
        sourceMap: omit(editingComputedFields.sourceMap, [selectedComputedField]),
        updatedSourceMap: omit(editingComputedFields.updatedSourceMap, [selectedComputedField]),
        order: [
          ...editingComputedFields.order.slice(0, selectedOrderIndex),
          ...editingComputedFields.order.slice(selectedOrderIndex + 1)
        ]
      }
    })
  }

  handleSave () {
    const { update } = this.props
    let { editingData, editingComputedFields } = this.state

    if (this.canSave()) {
      update({
        value: editingData.data,
        computedFields: editingComputedFields.order.map((fieldName) => {
          return {
            name: fieldName,
            source: editingComputedFields.sourceMap[fieldName]
          }
        })
      })

      this.setState({
        isDirty: false,
        isCreatingComputed: false,
        newComputedError: null
      })
    }
  }

  render () {
    const {
      editingData,
      editingComputedFields,
      selectedComputedField,
      isDirty,
      isCreatingComputed,
      dataInputError,
      newComputedError,
      computedValidationError
    } = this.state

    const canSave = this.canSave()
    const { dataValue, onClose } = this.props
    let currentValue

    if (dataValue != null && editingData.json != null) {
      currentValue = editingData.json
    } else if (dataValue == null && editingData.json != null) {
      currentValue = editingData.json
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
          ref={this.setDataTextNode}
          style={{ overflow: 'auto', resize: 'none', width: '100%', height: '250px' }}
          rows="25"
          value={currentValue}
          onChange={this.handleDataTextChange}
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
            <button onClick={() => this.setState({ isCreatingComputed: true })} disabled={!editingData || editingData.properties == null}>Add computed field</button>
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
              {editingComputedFields && editingComputedFields.sourceMap && Object.keys(editingComputedFields.sourceMap).map((computedName) => (
                <option key={computedName} value={computedName}>{computedName}{editingComputedFields.updatedSourceMap[computedName] != null ? '*' : ''}</option>
              ))}
            </select>
            <div style={{ marginTop: '5px', marginRight: '5px' }}>
              <button
                disabled={!selectedComputedField || !editingComputedFields || Object.keys(editingComputedFields).length === 0}
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
                defaultValue={editingComputedFields.updatedSourceMap[selectedComputedField] != null ? editingComputedFields.updatedSourceMap[selectedComputedField] : editingComputedFields.sourceMap[selectedComputedField]}
                onChange={this.handleComputedFieldChange}
              />
              <div style={{ marginTop: '5px', marginRight: '5px', textAlign: 'right' }}>
                <button onClick={this.handleComputedFieldSave}>Ok</button>
                {' '}
                <button
                  onClick={(ev) => this.setState({
                    selectedComputedField: null,
                    computedValidationError: null,
                    editingComputedFields: {
                      ...editingComputedFields,
                      updatedSourceMap: omit(editingComputedFields.updatedSourceMap, [selectedComputedField])
                    }
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
