import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class PropertyControl extends PureComponent {
  constructor (props) {
    super(props)

    this.handleBindingEditorOpen = this.handleBindingEditorOpen.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleBindingEditorOpen (ev) {
    ev.preventDefault()

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
    const { label, name, value, binding, context, bindingEnabled, renderValue } = this.props
    const getBindingMeta = this.props.getBindingMeta
    const meta = this.props.getPropMeta(name)

    let isSpecialValue = binding != null
    let currentValue

    if (isSpecialValue) {
      currentValue = getBindingMeta(name, 'displayName')
    }

    if (!isSpecialValue) {
      currentValue = value
    }

    return (
      <div className='propertiesEditor-prop'>
        <div>
          <label>
            {label || name}
            {' '}
          </label>
          <div className='propertiesEditor-prop-controls'>
            {meta && meta.allowsBinding !== false && (
              <button
                disabled={bindingEnabled === false}
                title='Edit Binding'
                onClick={this.handleBindingEditorOpen}
              >
                <span className='fa fa-bolt' />
              </button>
            )}
          </div>
        </div>
        {renderValue ? (
          renderValue({
            propName: name,
            value,
            binding,
            context,
            isSpecialValue,
            onChange: this.handleChange
          })
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
