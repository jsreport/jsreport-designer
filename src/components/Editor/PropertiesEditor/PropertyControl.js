import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class PropertyControl extends PureComponent {
  constructor (props) {
    super(props)

    this.handleBindToDataClick = this.handleBindToDataClick.bind(this)
    this.handleEditRichContentClick = this.handleEditRichContentClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
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

  handleChange (value) {
    const { name, context } = this.props

    if (this.props.onChange) {
      this.props.onChange({ propName: name, value, context })
    }
  }

  render () {
    const { label, name, value, binding, context, bindToData, renderValue } = this.props
    const getExpressionMeta = this.props.getExpressionMeta
    const meta = this.props.getPropMeta(name)

    let isSpecialValue = binding != null
    let isValueBinded = false
    let isValueRich = false
    let currentValue

    if (isSpecialValue) {
      isValueBinded = binding.expression != null
      isValueRich = binding.richContent != null
    }

    if (isValueBinded) {
      currentValue = getExpressionMeta(name, binding.expression, 'displayName')
    }

    if (isValueRich) {
      currentValue = '[rich content]'
    }

    if (!isSpecialValue) {
      currentValue = value
    }

    return (
      <div className="propertiesEditor-prop">
        <div>
          <label>
            {label || name}
            {' '}
          </label>
          <div className="propertiesEditor-prop-controls">
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
            onChange: this.handleChange
          })
        ) : (
          <input
            className={isSpecialValue ? 'propertiesEditor-prop-special-value' : ''}
            type="text"
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
  bindToData: PropTypes.bool.isRequired,
  context: PropTypes.any,
  getPropMeta: PropTypes.func.isRequired,
  getExpressionMeta: PropTypes.func.isRequired,
  renderValue: PropTypes.func,
  onBindToDataClick: PropTypes.func,
  onEditRichContentClick: PropTypes.func,
  onChange: PropTypes.func
}

export default PropertyControl
