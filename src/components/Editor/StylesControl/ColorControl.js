import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ColorPicker from '../../ColorPicker'

class ColorControl extends Component {
  constructor (props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (color) {
    const { name, onChange } = this.props

    onChange({ styleName: name, value: color })
  }

  render () {
    const { value } = this.props

    return (
      <div>
        <ColorPicker
          value={value}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}

ColorControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

export default ColorControl
