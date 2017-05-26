import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Grid.css'

class Grid extends Component {
  renderCols({ width, height }) {
    const {
      cols
    } = this.props

    let gridCols = []

    for (let i = 1; i <= cols; i++) {
      gridCols.push(
        <div
          className="Grid-cell"
          style={{ width: width + 'px', height: height + 'px' }}
          key={'Grid-cell-' + i}
        />
      )
    }

    return gridCols
  }

  renderRows() {
    const {
      baseWidth,
      baseHeight,
      rows,
      cols
    } = this.props

    let gridRows = []
    let colWidth = baseWidth / cols
    let colHeight = baseHeight / rows

    for (let i = 1; i <= rows; i++) {
      gridRows.push(
        <div
          className="Grid-row"
          style={{ width: baseWidth + 'px' }}
          key={'Grid-row-' + i}
        >
          {this.renderCols({ width: colWidth, height: colHeight })}
        </div>
      )
    }

    return gridRows
  }

  render () {
    const {
      baseWidth,
      baseHeight
    } = this.props

    const gridStyles = {
      width: baseWidth,
      height: baseHeight
    }

    return (
      <div className="Grid" style={gridStyles}>
        {this.renderRows()}
      </div>
    )
  }
}

Grid.propTypes = {
  baseWidth: PropTypes.number.isRequired,
  baseHeight: PropTypes.number.isRequired,
  cols: PropTypes.number.isRequired,
  rows: PropTypes.number.isRequired
}

export default Grid
