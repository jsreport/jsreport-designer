import React, { Component } from 'react'
import PropTypes from 'prop-types'
import omit from 'lodash/omit'
import DataFieldsViewer from '../DataFieldsViewer'

const DATA_SELECT_EXPRESSION_NAME = '$dataSelect'

function isDataSelectExpression (expressionName) {
  return expressionName === DATA_SELECT_EXPRESSION_NAME
}

class DataSelectBindingEditor extends Component {
  constructor (props) {
    super(props)

    let initialState = {
      isDirty: false,
      selectedField: props.options.defaultSelectedField != null ? props.options.defaultSelectedField : null
    }

    this.state = initialState

    this.changeBinding = this.changeBinding.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.handleUnselect = this.handleUnselect.bind(this)
    this.handleSave = this.handleSave.bind(this)
  }

  static getOptions ({ propName, bindingName, binding, component, getPropMeta }) {
    const propMeta = getPropMeta(propName)
    let allowedTypes
    let defaultSelectedField

    if (binding && component.expressions && isDataSelectExpression(binding.expression)) {
      defaultSelectedField = {
        dataExpression: component.expressions[bindingName][DATA_SELECT_EXPRESSION_NAME].value
      }
    }

    if (propMeta != null && Array.isArray(propMeta.allowedBindingValueTypes)) {
      allowedTypes = propMeta.allowedBindingValueTypes
    } else {
      // no types allowed
      allowedTypes = []
    }

    return {
      defaultSelectedField,
      allowedTypes
    }
  }

  changeBinding ({ selectedField }) {
    const { propName, bindingName, component, onSave } = this.props
    const bindings = component.bindings || {}
    const expressions = component.expressions || {}
    const currentBinding = bindings[bindingName]
    const currentExpression = expressions[bindingName]
    let currentHasDataExpressionValue = false
    let newBinding
    let newBindings
    let newExpression
    let newExpressions

    if (currentBinding) {
      newBinding = { ...currentBinding }
    } else {
      newBinding = {}
    }

    if (currentExpression) {
      newExpression = { ...currentExpression }
    } else {
      newExpression = {}
    }

    if (
      bindings &&
      currentBinding &&
      isDataSelectExpression(currentBinding.expression)
    ) {
      currentHasDataExpressionValue = true
    }

    if (selectedField != null) {
      newBinding.expression = DATA_SELECT_EXPRESSION_NAME

      newExpression[DATA_SELECT_EXPRESSION_NAME] = {
        type: 'data',
        value: selectedField.dataExpression
      }

      newBindings = {
        ...bindings,
        [bindingName]: newBinding
      }

      newExpressions = {
        ...expressions,
        [bindingName]: newExpression
      }
    } else if (selectedField == null && currentHasDataExpressionValue) {
      delete newBinding.expression
      delete newExpression[DATA_SELECT_EXPRESSION_NAME]

      if (Object.keys(newBinding).length === 0) {
        newBinding = null
      }

      if (Object.keys(newExpression).length === 0) {
        newExpression = null
      }

      if (newBinding) {
        newBindings = {
          ...bindings,
          [bindingName]: newBinding
        }
      } else {
        newBindings = omit(bindings, [propName, bindingName])

        if (Object.keys(newBindings).length === 0) {
          newBindings = null
        }
      }

      if (newExpression) {
        newExpressions = {
          ...expressions,
          [bindingName]: newExpression
        }
      } else {
        newExpressions = omit(expressions, [propName, bindingName])

        if (Object.keys(newExpressions).length === 0) {
          newExpressions = null
        }
      }
    }

    if (onSave) {
      onSave({
        bindings: newBindings,
        expressions: newExpressions
      })
    }
  }

  handleSelect (selectedField) {
    this.setState({
      isDirty: true,
      selectedField
    })
  }

  handleUnselect () {
    this.setState({
      isDirty: true,
      selectedField: null
    })
  }

  handleSave () {
    const { changeBinding } = this
    const { selectedField } = this.state

    changeBinding({ selectedField })
  }

  render () {
    const { isDirty, selectedField } = this.state
    const { componentType, propName, options, onClose } = this.props

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
        <div
          style={{
            marginTop: '0.6rem',
            marginBottom: '0.6rem',
            border: '1px solid black',
            overflow: 'auto'
          }}
        >
          <DataFieldsViewer
            selectedField={selectedField}
            dataFields={options.dataFields}
            allowedTypes={options.allowedTypes}
            onSelect={this.handleSelect}
          />
        </div>
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

DataSelectBindingEditor.propTypes = {
  componentType: PropTypes.string.isRequired,
  propName: PropTypes.string.isRequired,
  bindingName: PropTypes.string,
  component: PropTypes.object.isRequired,
  options: PropTypes.object,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default DataSelectBindingEditor
