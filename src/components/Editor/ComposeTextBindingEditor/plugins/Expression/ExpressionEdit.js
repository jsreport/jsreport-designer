import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import DataFieldsViewer from '../../../../../components/DataFieldsViewer'
import evaluateScript from '../../../../../../shared/evaluateScript'

class ExpressionEdit extends Component {
  constructor (props) {
    super(props)

    const initialState = {
      expressionName: '',
      selectedExpressionType: 'data',
      selectedDataField: null,
      expressionFunctionSource: 'function (context) {\n  // your logic here..\n  return\n}',
      expressionNameError: null,
      expressionValueError: null
    }

    if (props.initialExpression != null) {
      initialState.expressionName = props.initialExpression.name

      if (props.initialExpression.type === 'data') {
        initialState.selectedExpressionType = 'data'

        initialState.selectedDataField = {
          dataExpression: props.initialExpression.value
        }
      } else if (props.initialExpression.type === 'function') {
        initialState.selectedExpressionType = 'function'
        initialState.expressionFunctionSource = props.initialExpression.value
      }
    }

    this.state = initialState

    this.checkExpressionName = this.checkExpressionName.bind(this)
    this.checkExpressionValue = this.checkExpressionValue.bind(this)

    this.debouncedCheckExpressionName = debounce(
      this.checkExpressionName,
      200
    )

    this.handleExpressionNameChange = this.handleExpressionNameChange.bind(this)
    this.handleSelectedExpressionTypeChange = this.handleSelectedExpressionTypeChange.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  checkExpressionName (_expressionName) {
    const expressionName = _expressionName != null ? _expressionName.trim() : _expressionName
    const { initialExpression, expressions } = this.props
    let errorMessage

    if (expressionName == null || expressionName === '') {
      errorMessage = `expression name can't be empty`
    } else if (
      expressions != null &&
      expressions[expressionName] != null &&
      (initialExpression != null && initialExpression.name !== expressionName)
    ) {
      errorMessage = `expression with name ${expressionName} already exists`
    }

    if (errorMessage == null) {
      return true
    }

    this.setState({ expressionNameError: errorMessage })

    return false
  }

  checkExpressionValue (expressionType, expressionValue) {
    if (expressionType === 'data') {
      if (expressionValue == null) {
        this.setState({
          expressionValueError: `selection can't be empty, please select a data field`
        })

        return false
      }
    } else if (expressionType === 'function') {
      try {
        if (expressionValue.trim() === '') {
          throw new Error('you must write a function, please check your input')
        }

        let expressionFn = evaluateScript.getSingleExport(expressionValue)

        if (typeof expressionFn !== 'function') {
          throw new Error('you must write a function, please check your input')
        }

        return true
      } catch (evaluateErr) {
        this.setState({
          expressionValueError: evaluateErr.message
        })

        return false
      }
    } else {
      this.setState({
        expressionValueError: `selected expression type "${expressionType}" is unknown`
      })

      return false
    }

    return true
  }

  handleExpressionNameChange (ev) {
    const expressionName = ev.target.value

    this.setState({
      expressionName,
      expressionNameError: null
    })

    this.debouncedCheckExpressionName(expressionName)
  }

  handleSelectedExpressionTypeChange (ev) {
    const expressionType = ev.target.value
    const stateToUpdate = {}

    stateToUpdate.selectedExpressionType = expressionType

    if (expressionType !== 'data') {
      stateToUpdate.selectedDataField = null
    }

    this.setState(stateToUpdate)
  }

  handleSave () {
    const expressionName = this.state.expressionName.trim()

    const {
      selectedExpressionType,
      selectedDataField,
      expressionFunctionSource
    } = this.state

    const { initialExpression, onSave } = this.props
    let expressionValue

    if (!this.checkExpressionName(expressionName)) {
      return
    }

    if (selectedExpressionType === 'data') {
      expressionValue = selectedDataField.dataExpression
    } else if (selectedExpressionType === 'function') {
      expressionValue = expressionFunctionSource
    }

    if (!this.checkExpressionValue(selectedExpressionType, expressionValue)) {
      return
    }

    if (onSave) {
      onSave({
        prevExpressionName: initialExpression ? initialExpression.name : undefined,
        expression: {
          name: expressionName,
          type: selectedExpressionType,
          value: expressionValue
        }
      })
    }
  }

  handleClose () {
    const { onClose } = this.props

    if (onClose) {
      onClose()
    }
  }

  render () {
    const {
      expressionName,
      selectedExpressionType,
      selectedDataField,
      expressionFunctionSource,
      expressionNameError,
      expressionValueError
    } = this.state

    const { top, left, dataFields, allowedDataExpressionTypes } = this.props

    return (
      <div
        style={{
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: '280px',
          backgroundColor: '#b0c8d8',
          border: '1px solid #ccc',
          padding: '4px',
          zIndex: 1000
        }}
      >
        <input
          ref={(el) => { this.expressionNameNode = el }}
          autoFocus
          placeholder='Expression name'
          value={expressionName}
          onChange={this.handleExpressionNameChange}
        />
        <div style={{ color: 'red', fontSize: '0.7rem' }}>
          {expressionNameError != null ? expressionNameError : ' '}
        </div>
        <hr />
        <div>
          <div style={{ marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              <input
                type='radio'
                value='data'
                checked={selectedExpressionType === 'data'}
                onChange={this.handleSelectedExpressionTypeChange}
              />
              {' '}
              Select a data field
            </label>
          </div>
          <div style={{ backgroundColor: selectedExpressionType === 'data' ? '#fff' : '#ddd' }}>
            <DataFieldsViewer
              title='Context input fields'
              disabled={selectedExpressionType !== 'data'}
              selectedField={selectedDataField}
              dataFields={dataFields}
              allowedTypes={allowedDataExpressionTypes}
              onSelect={(selectedField) => this.setState({ selectedDataField: selectedField })}
            />
          </div>
        </div>
        <hr />
        <div>
          <div style={{ marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              <input
                type='radio'
                value='function'
                checked={selectedExpressionType === 'function'}
                onChange={this.handleSelectedExpressionTypeChange}
              />
              {' '}
              Write custom logic
            </label>
          </div>
          <div>
            <textarea
              style={{
                overflow: 'auto',
                resize: 'none',
                width: '100%',
                height: '150px',
                backgroundColor: selectedExpressionType === 'function' ? null : '#ddd'
              }}
              rows='25'
              disabled={selectedExpressionType !== 'function'}
              value={expressionFunctionSource}
              onChange={(ev) => this.setState({ expressionFunctionSource: ev.target.value })}
            />
          </div>
        </div>
        <div style={{ color: 'red', fontSize: '0.7rem' }}>
          {expressionValueError != null ? expressionValueError : ' '}
        </div>
        <hr />
        <button onClick={this.handleSave}>Save</button>
        <button onClick={this.handleClose}>Cancel</button>
      </div>
    )
  }
}

ExpressionEdit.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  initialExpression: PropTypes.object,
  dataFields: PropTypes.object,
  allowedDataExpressionTypes: PropTypes.arrayOf(PropTypes.string),
  expressions: PropTypes.object,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default ExpressionEdit
