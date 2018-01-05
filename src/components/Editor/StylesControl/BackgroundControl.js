import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ColorPicker from '../../ColorPicker'

class BackgroundControl extends Component {
  constructor (props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (color) {
    const { name, onChange } = this.props

    if (color != null) {
      onChange({ styleName: name, value: { color: color } })
    } else {
      onChange({ styleName: name, value: undefined })
    }
  }

  render () {
    const { value } = this.props

    return (
      <div>
        <ColorPicker
          value={value != null ? value.color : undefined}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}

BackgroundControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

export default BackgroundControl
