import React, { Component } from 'react'
import PropTypes from 'prop-types'

// eslint-disable-next-line react/prop-types
const AlignButton = ({ type, active, onClick, ...restProps }) => {
  let className = 'propertiesEditor-button-toogle'

  if (active) {
    className += ' propertiesEditor-button-toogle-active'
  }

  return (
    <button
      className={className}
      title={type}
      onClick={() => onClick(type)}
      {...restProps}
    >
      <span className={`fa fa-align-${type}`} />
    </button>
  )
}

class TextAlignControl extends Component {
  constructor (props) {
    super(props)

    this.handleButtonClick = this.handleButtonClick.bind(this)
  }

  handleButtonClick (alignType) {
    const { name, value, onChange } = this.props
    let newValue = alignType

    if (alignType === value) {
      newValue = undefined
    } else {
      newValue = alignType
    }

    onChange({ styleName: name, value: newValue })
  }

  render () {
    const { value } = this.props

    return (
      <div>
        <AlignButton
          type='left'
          active={value === 'left'}
          style={{ marginRight: '1px' }}
          onClick={this.handleButtonClick}
        />
        <AlignButton
          type='center'
          active={value === 'center'}
          style={{ marginRight: '1px' }}
          onClick={this.handleButtonClick}
        />
        <AlignButton
          type='right'
          active={value === 'right'}
          style={{ marginRight: '1px' }}
          onClick={this.handleButtonClick}
        />
        <AlignButton
          type='justify'
          active={value === 'justify'}
          onClick={this.handleButtonClick}
        />
      </div>
    )
  }
}

TextAlignControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

export default TextAlignControl
