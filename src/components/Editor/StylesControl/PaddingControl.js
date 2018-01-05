import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import NumericInput from '../../NumericInput'

class PaddingControl extends Component {
  constructor (props) {
    super(props)

    this.state = {
      allOptions: props.value != null && typeof props.value.padding === 'object'
    }

    this.handleOptionsChange = this.handleOptionsChange.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.renderPaddingOption = this.renderPaddingOption.bind(this)
  }

  getPaddingValue (value, type) {
    let result

    if (value == null) {
      return undefined
    }

    if (typeof value.padding === 'object') {
      result = value.padding[type]
    }

    return result
  }

  handleOptionsChange (ev) {
    const { name, value, onChange } = this.props
    const checked = ev.target.checked

    if (checked) {
      if (value != null && value.padding != null) {
        onChange({
          styleName: name,
          value: {
            unit: 'px',
            padding: {
              top: value.padding,
              left: value.padding,
              right: value.padding,
              bottom: value.padding
            }
          }
        })
      }
    } else {
      onChange({
        styleName: name,
        value: undefined
      })
    }

    this.setState(({ allOptions }) => ({ allOptions: !allOptions }))
  }

  handleChange (type, padding) {
    const { name, onChange } = this.props
    let newValue

    if (type == null) {
      if (padding != null) {
        newValue = {
          unit: 'px',
          padding: padding
        }
      }
    } else {
      let currentPaddingValue

      if (this.props.value != null) {
        currentPaddingValue = this.props.value.padding != null ? { ...this.props.value.padding } : {}
      } else {
        currentPaddingValue = {}
      }

      if (padding != null) {
        newValue = {
          unit: 'px',
          padding: {
            ...currentPaddingValue,
            [type]: padding
          }
        }
      } else {
        newValue = {
          unit: 'px',
          padding: {
            ...currentPaddingValue
          }
        }

        delete newValue.padding[type]
      }

      if (Object.keys(newValue.padding).length === 0) {
        newValue = undefined
      }
    }

    onChange({ styleName: name, value: newValue })
  }

  renderPaddingOption (type) {
    const { value } = this.props

    return (
      <div className='propertiesEditor-box'>
        <span style={{ display: 'inline-block', minWidth: '50px' }}>
          {`${type} `}
        </span>
        <NumericInput
          min={0}
          value={this.getPaddingValue(value, type)}
          onChange={(val) => this.handleChange(type, val)}
        />
      </div>
    )
  }

  render () {
    const { allOptions } = this.state
    const { value } = this.props

    return (
      <Fragment>
        <div>
          <label>
            <input
              type='checkbox'
              checked={allOptions}
              style={{ marginLeft: '0px' }}
              onChange={this.handleOptionsChange}
            />
            {' '}
            All options
          </label>
        </div>
        {!allOptions && (
          <div>
            <NumericInput
              min={0}
              value={value != null ? value.padding : undefined}
              onChange={(val) => this.handleChange(null, val)}
            />
          </div>
        )}
        {allOptions && (
          this.renderPaddingOption('top')
        )}
        {allOptions && (
          this.renderPaddingOption('left')
        )}
        {allOptions && (
          this.renderPaddingOption('right')
        )}
        {allOptions && (
          this.renderPaddingOption('bottom')
        )}
      </Fragment>
    )
  }
}

PaddingControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

export default PaddingControl
