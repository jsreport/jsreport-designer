import React, { Component } from 'react'
import PropTypes from 'prop-types'
import nanoid from 'nanoid'
import omit from 'lodash/omit'
import evaluateScript from '../../../shared/evaluateScript'
import { generalStylesDefinition } from '../../lib/configuration'

class StylesBindingEditor extends Component {
  constructor (props) {
    super(props)

    const { propName, component, options } = props
    const { bindings, expressions } = component
    const bindingName = `@${propName}.${options.styleName}`

    const styleNameBinding = (
      bindings != null &&
      bindings[bindingName] != null
    ) ? bindings[bindingName] : undefined

    let defaultValue = null
    let cases = []

    if (styleNameBinding != null) {
      if (
        styleNameBinding.compose != null &&
        typeof styleNameBinding.compose.conditional === 'object' &&
        styleNameBinding.compose.conditional.default != null
      ) {
        defaultValue = styleNameBinding.compose.conditional.default
      }

      if (styleNameBinding.expression != null) {
        cases = styleNameBinding.expression.map((exprName) => {
          let value

          if (
            styleNameBinding.compose != null &&
            styleNameBinding.compose.content != null &&
            styleNameBinding.compose.content[exprName] != null &&
            styleNameBinding.compose.conditional != null &&
            (
              styleNameBinding.compose.conditional === true ||
              styleNameBinding.compose.conditional.default != null
            )
          ) {
            value = styleNameBinding.compose.content[exprName]
          }

          return {
            name: exprName,
            conditionSource: (
              expressions != null &&
              expressions[bindingName] != null &&
              expressions[bindingName][exprName] != null
            ) ? expressions[bindingName][exprName].value : '',
            valueWhenMatched: value
          }
        })
      }
    }

    let initialState = {
      isDirty: false,
      showDefaultControl: defaultValue != null,
      conditions: {
        default: defaultValue,
        cases
      }
    }

    this.state = initialState

    this.handleNewCondition = this.handleNewCondition.bind(this)
    this.handleToogleDefaultValue = this.handleToogleDefaultValue.bind(this)
    this.handleConditionSourceChange = this.handleConditionSourceChange.bind(this)
    this.handleStyleValueChange = this.handleStyleValueChange.bind(this)
    this.handleRemoveCondition = this.handleRemoveCondition.bind(this)
    this.handleUnbind = this.handleUnbind.bind(this)
    this.handleSave = this.handleSave.bind(this)

    this.renderStyleControl = this.renderStyleControl.bind(this)
    this.renderConditions = this.renderConditions.bind(this)
  }

  handleNewCondition () {
    const { conditions } = this.state

    this.setState({
      isDirty: true,
      conditions: {
        ...conditions,
        cases: [
          ...conditions.cases,
          {
            name: nanoid(7),
            conditionSource: `function (context) {\n  return\n}`,
            valueWhenMatched: null,
            error: null
          }
        ]
      }
    })
  }

  handleToogleDefaultValue (ev) {
    const { conditions } = this.state
    const checked = ev.target.checked

    let stateChanges = {
      showDefaultControl: checked
    }

    if (conditions.default != null && !checked) {
      stateChanges.isDirty = true
    }

    this.setState(stateChanges)
  }

  handleConditionSourceChange (index, newSource) {
    const { conditions } = this.state
    const currentCase = conditions.cases[index]

    this.setState({
      isDirty: true,
      conditions: {
        ...conditions,
        cases: [
          ...conditions.cases.slice(0, index),
          {
            ...currentCase,
            conditionSource: newSource
          },
          ...conditions.cases.slice(index + 1)
        ]
      }
    })
  }

  handleStyleValueChange (index, newValue) {
    const { conditions } = this.state

    if (index == null) {
      // when index is no specified then we are updating the default
      // value
      this.setState({
        isDirty: true,
        conditions: {
          ...conditions,
          default: newValue
        }
      })
    } else {
      // get the case that need the style update
      const currentCase = conditions.cases[index]

      this.setState({
        isDirty: true,
        conditions: {
          ...conditions,
          cases: [
            ...conditions.cases.slice(0, index),
            {
              ...currentCase,
              valueWhenMatched: newValue
            },
            ...conditions.cases.slice(index + 1)
          ]
        }
      })
    }
  }

  handleRemoveCondition (index) {
    const { conditions } = this.state

    this.setState({
      isDirty: true,
      conditions: {
        ...conditions,
        cases: [
          ...conditions.cases.slice(0, index),
          ...conditions.cases.slice(index + 1)
        ]
      }
    })
  }

  handleUnbind () {
    const { propName, component, options, onSave } = this.props
    const bindingName = `@${propName}.${options.styleName}`
    const bindings = component.bindings || {}
    const expressions = component.expressions || {}
    let newBindings
    let newExpressions

    newBindings = omit(bindings, [propName, bindingName])

    if (Object.keys(newBindings).length === 0) {
      newBindings = null
    }

    newExpressions = omit(expressions, [propName, bindingName])

    if (Object.keys(newExpressions).length === 0) {
      newExpressions = null
    }

    if (onSave) {
      onSave({
        bindings: newBindings,
        expressions: newExpressions
      })
    }
  }

  handleSave () {
    const { propName, component, options, onSave } = this.props
    const { showDefaultControl, conditions } = this.state
    const cases = conditions.cases
    const bindingName = `@${propName}.${options.styleName}`
    const bindings = component.bindings || {}
    const expressions = component.expressions || {}
    const errors = []
    let newBinding = {}
    let newBindings
    let newExpression = {}
    let newExpressions

    if (cases.length > 0) {
      newBinding.expression = []
      newBinding.compose = {}
      newBinding.compose.content = {}

      if (conditions.default != null && showDefaultControl) {
        newBinding.compose.conditional = {
          default: conditions.default
        }
      } else {
        newBinding.compose.conditional = true
      }

      cases.forEach((cond, condIndex) => {
        newBinding.expression.push(cond.name)
        newBinding.compose.content[cond.name] = cond.valueWhenMatched

        // check if source is a valid function
        try {
          let computedFn = evaluateScript.getSingleExport(cond.conditionSource)

          if (typeof computedFn !== 'function') {
            throw new Error('computed field must export a function')
          }

          newExpression[cond.name] = {
            type: 'function',
            value: cond.conditionSource
          }
        } catch (evaluateErr) {
          errors.push({ index: condIndex, message: evaluateErr.message })
        }
      })
    } else if (conditions.default != null && showDefaultControl) {
      newBinding.compose = {}

      newBinding.compose.conditional = {
        default: conditions.default
      }

      newExpression = null
    } else {
      newBinding = null
      newExpression = null
    }

    // show errors if detected
    if (errors.length > 0) {
      let newCases = [...conditions.cases]

      errors.forEach((err) => {
        newCases[err.index] = {
          ...newCases[err.index],
          error: `${err.message}. Check the condition source`
        }
      })

      return this.setState({
        conditions: {
          ...conditions,
          cases: newCases
        }
      })
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

    if (onSave) {
      onSave({
        bindings: newBindings,
        expressions: newExpressions
      })
    }
  }

  renderStyleControl (index, styleName, styleValue) {
    const styleDef = generalStylesDefinition[styleName]

    if (styleDef == null) {
      return null
    }

    const { control } = styleDef

    if (control == null) {
      return null
    }

    return (
      <div className='propertiesEditor-prop'>
        {React.createElement(control, {
          name: styleName,
          value: styleValue,
          onChange: ({ value }) => this.handleStyleValueChange(index, value)
        })}
      </div>
    )
  }

  renderConditions () {
    const { conditions } = this.state
    const { options } = this.props

    return (
      <div style={{ maxHeight: '500px', overflow: 'auto', marginBottom: '0.6rem' }}>
        {conditions.cases.map((currentCase, currentCaseIndex) => (
          <div
            key={currentCase.name}
            style={{
              position: 'relative',
              paddingLeft: '0.4rem',
              paddingRight: '0.4rem',
              paddingBottom: '28px',
              marginTop: '0.6rem',
              marginBottom: '0.6rem',
              border: '1px solid black',
              overflow: 'auto'
            }}
          >
            <div style={{ marginBottom: '0.3rem' }}>
              <div style={{ marginBottom: '0.3rem' }}>
                <b>condition</b>
                <br />
              </div>
              <div>
                <textarea
                  style={{
                    overflow: 'auto',
                    resize: 'none',
                    width: '100%',
                    height: '100px'
                  }}
                  rows='25'
                  value={currentCase.conditionSource}
                  onChange={
                    (ev) => this.handleConditionSourceChange(
                      currentCaseIndex,
                      ev.target.value
                    )
                  }
                />
              </div>
            </div>
            <div style={{ marginBottom: '0.3rem' }}>
              <div style={{ marginBottom: '0.3rem' }}>
                <b>{options.styleDisplayName || options.styleName}</b>
              </div>
              <div>
                {this.renderStyleControl(
                  currentCaseIndex,
                  options.styleName,
                  currentCase.valueWhenMatched
                )}
              </div>
            </div>
            <div style={{ color: 'red' }}>
              {currentCase.error != null ? currentCase.error : null}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                paddingRight: '0.4rem',
                paddingBottom: '0.2rem'
              }}
            >
              <button
                onClick={() => this.handleRemoveCondition(currentCaseIndex)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  render () {
    const { showDefaultControl, isDirty, conditions } = this.state
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
          Styles Editor - {`${componentType} (property: ${propName}/${options.styleDisplayName || options.styleName}${isDirty ? '*' : ''})`}
        </h3>
        <br />
        <div style={{ fontSize: '0.7rem' }}>
          Define some conditions and apply a style accordingly to each case, a condition should resolve to true in order to apply its associated style
        </div>
        <br />
        <div>
          {this.renderConditions()}
          <button onClick={this.handleNewCondition}>Add new condition</button>
        </div>
        <br />
        <div style={{ fontSize: '0.7rem' }}>
          In case no condition is resolved as true, you can apply a default value as well
          <br />
          <br />
          <label>
            <input
              type='checkbox'
              checked={showDefaultControl}
              style={{ marginLeft: '0px' }}
              onChange={this.handleToogleDefaultValue}
            />
            Define default value
          </label>
        </div>
        {showDefaultControl && (
          <div>
            <div style={{ marginBottom: '0.3rem' }}>
              <b>{options.styleDisplayName || options.styleName}</b>
            </div>
            {this.renderStyleControl(
              undefined,
              options.styleName,
              conditions.default
            )}
          </div>
        )}
        <br />
        <button onClick={this.handleSave}>Save</button>
        {' '}
        <button
          disabled={conditions.cases.length === 0 && conditions.default == null}
          onClick={this.handleUnbind}
        >
          Unbind
        </button>
        {' '}
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}

StylesBindingEditor.propTypes = {
  componentType: PropTypes.string.isRequired,
  propName: PropTypes.string.isRequired,
  component: PropTypes.object.isRequired,
  options: PropTypes.object,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default StylesBindingEditor
