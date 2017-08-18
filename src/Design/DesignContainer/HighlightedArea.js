import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class HighlightedArea extends PureComponent {
  render () {
    const {
      width,
      height,
      top,
      left,
      isValid
    } = this.props

    return (
      <div style={{
        display: 'inline-block',
        position: 'absolute',
        backgroundColor: isValid ? 'rgba(194, 236, 203, 0.6)' : 'rgba(226, 145, 145, 0.6)',
        top,
        left,
        width,
        height,
        zIndex: 1
      }}
      >
        {' '}
      </div>
    )
  }
}

HighlightedArea.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  isValid: PropTypes.bool.isRequired,
}

export default HighlightedArea
