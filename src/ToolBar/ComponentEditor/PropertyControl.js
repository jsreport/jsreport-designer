import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import './PropertyControl.css'

class PropertyControl extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      showBindToDataEditor: false
    }

    this.handleBindToDataClick = this.handleBindToDataClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleBindToDataClick () {
    if (this.props.onBindToDataClick) {
      this.props.onBindToDataClick({
        propName: this.props.name,
        componentType: this.props.componentType
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
    const { name, value, bindToData } = this.props

    let isBindedValue = typeof value === 'object' && value.bindedToData

    return (
      <div className="ComponentEditor-prop">
        <label>
          {name}
          {' '}
          {bindToData !== 'none' && (
            <button
              disabled={bindToData === 'disabled'}
              title="Bind to data"
              onClick={this.handleBindToDataClick}
            >
              <span className="fa fa-chain"></span>
            </button>
          )}
        </label>
        <input
          className={isBindedValue ? 'Property-Control-binded-value' : ''}
          type="text"
          name={name}
          readOnly={isBindedValue}
          value={isBindedValue ? `[${value.expression}]` : value}
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
  bindToData: PropTypes.oneOf(['disabled', 'none']),
  onBindToDataClick: PropTypes.func,
  onChange: PropTypes.func
}

export default PropertyControl
