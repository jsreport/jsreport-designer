import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class CanvasSelectedArea extends PureComponent {
  render () {
    const styles = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 0
    }

    const {
      width,
      height,
      top,
      left,
      isValid
    } = this.props

    return (
      <div style={styles}>
        <div style={{
          display: 'inline-block',
          position: 'absolute',
          backgroundColor: isValid ? 'rgba(194, 236, 203, 0.6)' : 'rgba(226, 145, 145, 0.6)',
          top,
          left,
          width,
          height,
        }}
        >
          {' '}
        </div>
      </div>
    )
  }
}

CanvasSelectedArea.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  isValid: PropTypes.bool.isRequired,
}

export default CanvasSelectedArea
