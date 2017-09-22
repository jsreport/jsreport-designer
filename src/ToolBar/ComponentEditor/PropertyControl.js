import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import './PropertyControl.css'
const componentRegistry = require('../../shared/componentRegistry')

class PropertyControl extends PureComponent {
  constructor (props) {
    super(props)

    this.meta = componentRegistry.getComponentDefinitionFromType(props.componentType) || {}
    this.meta = this.meta.propsMeta || {}
    this.meta = this.meta[props.name] || {}

    this.state = {
      showBindToDataEditor: false
    }

    this.handleBindToDataClick = this.handleBindToDataClick.bind(this)
    this.handleEditRichContentClick = this.handleEditRichContentClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleBindToDataClick (ev) {
    ev.preventDefault()

    if (this.props.onBindToDataClick) {
      this.props.onBindToDataClick({
        propName: this.props.name
      })
    }
  }

  handleEditRichContentClick (ev) {
    ev.preventDefault()

    if (this.props.onEditRichContentClick) {
      this.props.onEditRichContentClick({
        propName: this.props.name
      })
    }
  }

  handleChange (ev) {
    const { name } = this.props

    if (this.props.onChange) {
      this.props.onChange({ propName: name, value: ev.target.value })
    }
  }

  render () {
    const meta = this.meta
    const { name, value, binding, bindToData } = this.props

    let isSpecialValue = binding != null
    let isValueBindToData = false
    let isValueRich = false
    let currentValue

    if (isSpecialValue) {
      isValueBindToData = binding.defaultExpression != null
      isValueRich = binding.richContent != null
    }

    if (isValueBindToData) {
      currentValue = `[${binding.defaultExpression}]`
    }

    if (isValueRich) {
      currentValue = '[rich content]'
    }

    if (!isSpecialValue) {
      currentValue = value
    }

    return (
      <div className="ComponentEditor-prop">
        <div>
          <label>
            {name}
            {' '}
          </label>
          <div className="ComponentEditor-prop-controls">
            {bindToData !== 'none' && (
              <button
                disabled={bindToData === 'disabled'}
                title="Bind to data"
                onClick={this.handleBindToDataClick}
              >
                <span className="fa fa-bolt"></span>
              </button>
            )}
            {meta.allowsRichContent && (
              <button
                title="Edit rich content"
                onClick={this.handleEditRichContentClick}
              >
                <span className="fa fa-book"></span>
              </button>
            )}
          </div>
        </div>
        <input
          className={isSpecialValue ? 'Property-Control-special-value' : ''}
          type="text"
          name={name}
          readOnly={isSpecialValue}
          value={currentValue}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}

PropertyControl.propTypes = {
  componentType: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  binding: PropTypes.object,
  bindToData: PropTypes.oneOf(['disabled', 'none']),
  onBindToDataClick: PropTypes.func,
  onEditRichContentClick: PropTypes.func,
  onChange: PropTypes.func
}

export default PropertyControl
