import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'

class DataInputEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      canSave: props.dataInput != null,
      isDirty: false,
      error: null
    }

    this.currentDataInput = null

    this.setTextAreaNode = this.setTextAreaNode.bind(this)

    this.handleInputChange = debounce(
      this.handleInputChange.bind(this),
      400,
      { leading: true }
    )

    this.handleSave = this.handleSave.bind(this)
  }

  setTextAreaNode (el) {
    this.textAreaNode = el
  }

  extractProperties (json, _blackList = [], parentType) {
    let indexes = []
    let properties = []
    let blackList = [..._blackList]
    let type
    let result

    if (typeof json !== 'object' || json == null) {
      return
    }

    if (Array.isArray(json)) {
      type = 'array'
    } else {
      type = 'object'
    }

    for (let key in json) {
      if (!json.hasOwnProperty(key) || (type === 'object' && blackList.indexOf(key) !== -1)) {
        continue;
      }

      if (parentType == null || (parentType === 'object' && type !== 'array')) {
        blackList = []
      }

      if (typeof json[key] === 'object' && json[key] != null) {
        let keyIsArray = Array.isArray(json[key])
        let innerProperties = this.extractProperties(json[key], blackList, type)
        let item

        if (!innerProperties) {
          continue;
        }

        item = {
          type: keyIsArray ? 'array' : 'object'
        }

        if (type === 'array') {
          indexes.push(key)

          if (!keyIsArray && innerProperties.properties && innerProperties.properties.length > 0) {
            blackList = blackList.concat(innerProperties.properties.filter((propKey) => {
              return typeof propKey === 'string'
            }))

            properties = properties.concat(innerProperties.properties)
          }
        } else {
          item.key = key
          item.properties = innerProperties.properties
        }

        if (keyIsArray) {
          item.indexes = innerProperties.indexes
          properties.push(item)
        } else if (type === 'object' && !keyIsArray) {
          properties.push(item)
        }
      } else {
        if (type === 'array') {
          indexes.push(key)
        } else {
          properties.push(key)
        }
      }
    }

    result = {
      type
    }

    if (type === 'array') {
      result.indexes = indexes

      if (properties.length > 0) {
        result.properties = properties
      }
    } else {
      result.properties = properties
    }

    return result
  }

  handleInputChange () {
    let jsonText = this.textAreaNode.value
    let invalidProperties = false
    let jsonObj
    let error
    let parsedProperties

    let stateToUpdate = {
      isDirty: true
    }

    try {
      jsonObj = JSON.parse(jsonText)
    } catch (e) {
      error = `Value entered is not valid json (${e.message})`
    }

    if (error) {
      this.currentDataInput = null

      stateToUpdate.canSave = false
      stateToUpdate.error = jsonText !== '' ? error : null

      return this.setState(stateToUpdate)
    }

    parsedProperties = this.extractProperties(jsonObj)

    if (!parsedProperties) {
      invalidProperties = true
    } else if (
      parsedProperties.type === 'array' &&
      parsedProperties.indexes.length === 0
    ) {
      invalidProperties = true
    } else if (
      parsedProperties.type === 'object' &&
      parsedProperties.properties.length === 0
    ) {
      invalidProperties = true
    }

    if (invalidProperties) {
      this.currentDataInput = null

      stateToUpdate.canSave = false
      stateToUpdate.error = 'JSON value entered has no properties to extract'

      return this.setState(stateToUpdate)
    }

    this.currentDataInput = {
      data: jsonObj,
      json: jsonText,
      parsedProperties
    }

    stateToUpdate.canSave = true
    stateToUpdate.error = null

    this.setState(stateToUpdate)
  }

  handleSave () {
    const { onSave } = this.props
    const { canSave } = this.state

    if (!canSave || !this.currentDataInput) {
      return
    }

    this.setState({
      isDirty: false
    })

    onSave(this.currentDataInput)
  }

  render () {
    const { canSave, isDirty, error } = this.state
    const { dataInput, onClose } = this.props

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
        <h3 style={{ marginTop: '0.3rem', marginBottom: '0.3rem' }}>Data Input{isDirty ? '*' : ''}</h3>
        <br />
        <div style={{ fontSize: '0.7rem' }}>
          Paste here the json data which is the input of your jsreport requests
        </div>
        <br />
        <textarea
          ref={this.setTextAreaNode}
          style={{ overflow: 'auto', resize: 'none', width: '100%' }}
          rows="25"
          defaultValue={dataInput ? dataInput.json : '' }
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
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default DataInputEditor
