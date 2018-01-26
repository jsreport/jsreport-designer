import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import NumericInput from '../../NumericInput'

class MarginControl extends Component {
  constructor (props) {
    super(props)

    this.state = {
      allOptions: props.value != null && typeof props.value.margin === 'object'
    }

    this.handleOptionsChange = this.handleOptionsChange.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.renderMarginOption = this.renderMarginOption.bind(this)
  }

  getMarginValue (value, type) {
    let result

    if (value == null) {
      return undefined
    }

    if (typeof value.margin === 'object') {
      result = value.margin[type]
    }

    return result
  }

  handleOptionsChange (ev) {
    const { name, value, onChange } = this.props
    const checked = ev.target.checked

    if (checked) {
      if (value != null && value.margin != null) {
        onChange({
          styleName: name,
          value: {
            unit: 'px',
            margin: {
              top: value.margin,
              left: value.margin,
              right: value.margin,
              bottom: value.margin
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

  handleChange (type, margin) {
    const { name, onChange } = this.props
    let newValue

    if (type == null) {
      if (margin != null) {
        newValue = {
          unit: 'px',
          margin: margin
        }
      }
    } else {
      let currentMarginValue

      if (this.props.value != null) {
        currentMarginValue = this.props.value.margin != null ? { ...this.props.value.margin } : {}
      } else {
        currentMarginValue = {}
      }

      if (margin != null) {
        newValue = {
          unit: 'px',
          margin: {
            ...currentMarginValue,
            [type]: margin
          }
        }
      } else {
        newValue = {
          unit: 'px',
          margin: {
            ...currentMarginValue
          }
        }

        delete newValue.margin[type]
      }

      if (Object.keys(newValue.margin).length === 0) {
        newValue = undefined
      }
    }

    onChange({ styleName: name, value: newValue })
  }

  renderMarginOption (type) {
    const { value } = this.props

    return (
      <div className='propertiesEditor-box'>
        <span style={{ display: 'inline-block', minWidth: '50px' }}>
          {`${type} `}
        </span>
        <NumericInput
          min={0}
          value={this.getMarginValue(value, type)}
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
              value={value != null ? value.margin : undefined}
              onChange={(val) => this.handleChange(null, val)}
            />
          </div>
        )}
        {allOptions && (
          this.renderMarginOption('top')
        )}
        {allOptions && (
          this.renderMarginOption('left')
        )}
        {allOptions && (
          this.renderMarginOption('right')
        )}
        {allOptions && (
          this.renderMarginOption('bottom')
        )}
      </Fragment>
    )
  }
}

MarginControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

export default MarginControl
