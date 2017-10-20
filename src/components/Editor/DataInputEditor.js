import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject } from 'mobx-react'
import debounce from 'lodash/debounce'

@inject((injected) => ({
  dataInput: injected.dataInputStore.value,
  extractProperties: injected.dataInputStore.extractProperties,
  update: injected.dataInputActions.update
}))
@observer
class DataInputEditor extends Component {
  constructor (props) {
    super(props)

    this.state = {
      dataValue: null,
      canSave: false,
      isDirty: false,
      error: null,
    }

    this.checkData = debounce(
      this.checkData.bind(this),
      400
    )

    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.setTextAreaNode = this.setTextAreaNode.bind(this)
  }

  componentWillMount () {
    const { dataInput } = this.props

    this.setState({
      dataValue: dataInput,
      canSave: dataInput != null
    })
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.dataInput !== nextProps.dataInput) {
      this.setState({
        isDirty: false
      })
    }
  }

  setTextAreaNode (el) {
    this.textAreaNode = el
  }

  checkData () {
    const { dataValue } = this.state
    const { extractProperties } = this.props
    let currentDataInput = dataValue || {}
    let jsonText = currentDataInput.json || ''
    let invalidProperties = false
    let jsonObj
    let parsedProperties

    let stateToUpdate = {
      dataValue: { ...currentDataInput },
      canSave: false
    }

    try {
      jsonObj = JSON.parse(jsonText)
    } catch (e) {
      return this.setState({
        ...stateToUpdate,
        error: `Value entered is not valid json (${e.message})`
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
        error: 'JSON value entered has no properties to extract'
      })
    }

    stateToUpdate.dataValue.data = jsonObj
    stateToUpdate.dataValue.parsedProperties = parsedProperties
    stateToUpdate.canSave = true

    this.setState(stateToUpdate)
  }

  handleInputChange () {
    const { dataValue } = this.state
    let currentDataInput = dataValue || {}
    let jsonText = this.textAreaNode.value

    let stateToUpdate = {
      canSave: false,
      error: null,
      dataValue: {
        ...currentDataInput,
        json: jsonText
      },
      isDirty: true
    }

    this.setState(stateToUpdate)

    this.checkData()
  }

  handleSave () {
    const { update } = this.props
    let { canSave } = this.state

    if (canSave) {
      update(this.state.dataValue)
    }
  }

  render () {
    const { dataValue, isDirty, canSave, error } = this.state
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
          ref={this.setTextAreaNode}
          style={{ overflow: 'auto', resize: 'none', width: '100%' }}
          rows="25"
          value={currentValue}
          onChange={this.handleInputChange}
        />
        <br />
        <div style={{ color: 'red' }}>{error || ' '}</div>
        <br />
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
