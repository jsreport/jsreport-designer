import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Grid.css'

class Grid extends Component {
  renderCols(cols) {
    let gridCols = cols.map((col, i) => {
      return (
        <div
          className="Grid-cell"
          style={{ width: col.width + col.unit, height: '100%' }}
          key={'Grid-cell-' + i}
        />
      )
    })
    return gridCols
  }

  renderRows() {
    const {
      rows
    } = this.props

    let gridRows = rows.map((row, i) => {
      let rowStyles = {
        height: row.height + row.unit
      }

      if (row.placeholder === true) {
        rowStyles.backgroundColor = 'rgba(87, 191, 216, 0.3)'
      }

      return (
        <div
          className="Grid-row"
          style={rowStyles}
          key={'Grid-row-' + i}
        >
          {this.renderCols(row.cols)}
        </div>
      )
    })

    return gridRows
  }

  render () {
    const {
      baseWidth
    } = this.props

    const gridStyles = {
      width: baseWidth
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
  rows: PropTypes.array.isRequired
}

export default Grid
