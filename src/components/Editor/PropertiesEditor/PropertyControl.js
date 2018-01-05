import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import isStyleProp from '../../../../shared/isStyleProp'
import StylesControl from '../StylesControl'

class PropertyControl extends PureComponent {
  constructor (props) {
    super(props)

    this.stylePropCheck = this.stylePropCheck.bind(this)
    this.handleBindingEditorOpen = this.handleBindingEditorOpen.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  stylePropCheck (propName) {
    const { getPropMeta } = this.props
    const propMeta = getPropMeta(propName)

    return isStyleProp(propMeta)
  }

  handleBindingEditorOpen () {
    if (this.props.onBindingEditorOpen) {
      this.props.onBindingEditorOpen({
        propName: this.props.name,
        context: this.props.context
      })
    }
  }

  handleChange (value) {
    const { name, context } = this.props

    if (this.props.onChange) {
      this.props.onChange({ propName: name, value, context })
    }
  }

  render () {
    const { componentType, label, name, value, binding, bindingEnabled, renderValue } = this.props
    const stylePropCheck = this.stylePropCheck
    const getBindingMeta = this.props.getBindingMeta
    const meta = this.props.getPropMeta(name)

    const propsForCustomControl = {
      ...this.props,
      componentType,
      onBindingEditorOpen: this.handleBindingEditorOpen,
      onChange: this.handleChange
    }

    let isSpecialValue = binding != null
    let currentValue

    if (isSpecialValue) {
      currentValue = getBindingMeta(name, 'displayName')
    }

    if (!isSpecialValue) {
      currentValue = value
    }

    // if prop is a style prop then render style control
    if (stylePropCheck(name)) {
      return (
        <StylesControl
          {...propsForCustomControl}
        />
      )
    }

    return (
      <div className='propertiesEditor-prop'>
        <div>
          <label>
            {label || meta.displayName || name}
            {' '}
          </label>
          <div className='propertiesEditor-prop-controls'>
            {meta && meta.allowsBinding !== false && (
              <button
                className='propertiesEditor-button'
                disabled={bindingEnabled === false}
                title='Edit Binding'
                onClick={(ev) => { ev.preventDefault(); this.handleBindingEditorOpen() }}
              >
                <span className='fa fa-bolt' />
              </button>
            )}
          </div>
        </div>
        {renderValue ? (
          renderValue(propsForCustomControl)
        ) : (
          <input
            className={isSpecialValue ? 'propertiesEditor-prop-special-value' : ''}
            type='text'
            name={name}
            readOnly={isSpecialValue}
            value={currentValue}
            onChange={(ev) => this.handleChange(ev.target.value)}
          />
        )}
      </div>
    )
  }
}

PropertyControl.propTypes = {
  componentType: PropTypes.string.isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  binding: PropTypes.object,
  bindingEnabled: PropTypes.bool.isRequired,
  context: PropTypes.any,
  getPropMeta: PropTypes.func.isRequired,
  getBindingMeta: PropTypes.func.isRequired,
  renderValue: PropTypes.func,
  onBindingEditorOpen: PropTypes.func,
  onChange: PropTypes.func
}

export default PropertyControl
