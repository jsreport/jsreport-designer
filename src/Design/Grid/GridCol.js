import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class GridCol extends PureComponent {
  render () {
    const {
      left,
    } = this.props

    let colStyles = {
      left: `${left}px`
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
