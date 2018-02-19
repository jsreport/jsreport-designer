import React, { Component } from 'react'
import PropTypes from 'prop-types'
import NumericInput from '../../NumericInput'

class WidthControl extends Component {
  constructor (props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (size) {
    const { name, onChange } = this.props

    if (size != null) {
      onChange({
        styleName: name,
        value: {
          unit: 'px',
          size
        }
      })
    } else {
      onChange({ styleName: name, value: undefined })
    }
  }

  render () {
    const { value } = this.props

    return (
      <div>
        <NumericInput
          min={0}
          value={value != null ? value.size : undefined}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}

WidthControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

export default WidthControl
