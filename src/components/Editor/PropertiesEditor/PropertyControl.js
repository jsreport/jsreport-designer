import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class PropertyControl extends PureComponent {
  constructor (props) {
    super(props)

    this.handleBindToDataClick = this.handleBindToDataClick.bind(this)
    this.handleEditRichContentClick = this.handleEditRichContentClick.bind(this)
    this.handleValueChange = this.handleValueChange.bind(this)
  }

  handleBindToDataClick (ev) {
    ev.preventDefault()

    if (this.props.onBindToDataClick) {
      this.props.onBindToDataClick({
        propName: this.props.name,
        context: this.props.context
      })
    }
  }

  handleEditRichContentClick (ev) {
    ev.preventDefault()

    if (this.props.onEditRichContentClick) {
      this.props.onEditRichContentClick({
        propName: this.props.name,
        context: this.props.context
      })
    }
  }

  handleValueChange (value) {
    const { name, context } = this.props

    if (this.props.onValueChange) {
      this.props.onValueChange({ propName: name, value, context })
    }
  }

  render () {
    const { label, name, value, binding, context, bindToData, renderValue } = this.props
    const meta = this.props.getMeta(name)

    let isSpecialValue = binding != null
    let isValueBindToData = false
    let isValueRich = false
    let currentValue

    if (isSpecialValue) {
      isValueBindToData = binding.defaultExpression != null
      isValueRich = binding.richContent != null
    }

    if (isValueBindToData) {
      currentValue = `[${binding.defaultExpression.meta.fullId}]`
    }

    if (isValueRich) {
      currentValue = '[rich content]'
    }

    if (!isSpecialValue) {
      currentValue = value
    }

    return (
      <div className="PropertiesEditor-prop">
        <div>
          <label>
            {label || name}
            {' '}
          </label>
          <div className="PropertiesEditor-prop-controls">
            {meta && meta.allowsBinding !== false && (
              <button
                disabled={bindToData === false}
                title="Bind to data"
                onClick={this.handleBindToDataClick}
              >
                <span className="fa fa-bolt"></span>
              </button>
            )}
            {meta && meta.allowsRichContent && (
              <button
                title="Edit rich content"
                onClick={this.handleEditRichContentClick}
              >
                <span className="fa fa-book"></span>
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
            onValueChange: this.handleValueChange
          })
        ) : (
          <input
            className={isSpecialValue ? 'PropertiesEditor-prop-special-value' : ''}
            type="text"
            name={name}
            readOnly={isSpecialValue}
            value={currentValue}
            onChange={(ev) => this.handleValueChange(ev.target.value)}
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
  bindToData: PropTypes.bool.isRequired,
  context: PropTypes.any,
  getMeta: PropTypes.func.isRequired,
  renderValue: PropTypes.func,
  onBindToDataClick: PropTypes.func,
  onEditRichContentClick: PropTypes.func,
  onValueChange: PropTypes.func
}

export default PropertyControl
