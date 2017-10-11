import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class HighlightedArea extends PureComponent {
  render () {
    const {
      width,
      height,
      top,
      left,
      color
    } = this.props

    let position = `translate(${left}px, ${top}px)`

    return (
      <div style={{
        display: 'inline-block',
        position: 'absolute',
        backgroundColor: color,
        WebkitTransform: position,
        MsTransform: position,
        transform: position,
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
  color: PropTypes.string.isRequired,
}

export default HighlightedArea
