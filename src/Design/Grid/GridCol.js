import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class GridCol extends PureComponent {
  render () {
    const {
      left,
    } = this.props

    let position = `translateX(${left}px)`

    let colStyles = {
      WebkitTransform: position,
      MsTransform: position,
      transform: position
    }

    return (
      <div className="Grid-col" data-design-grid-border="true" style={colStyles} />
    )
  }
}

GridCol.propTypes = {
  left: PropTypes.number.isRequired
}

export default GridCol
