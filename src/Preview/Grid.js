import React, { Component } from 'react'
import PropTypes from 'prop-types'
import GridCol from './GridCol'
import './Grid.css'

class Grid extends Component {
  renderCols(cols, { isDragOverParent, selectedArea, onDragOver }) {
    let gridCols = cols.map((col, i) => {
      let selected = null

      if (
        selectedArea &&
        selectedArea.area[col.index + ',' + col.row] != null
      ) {
        selected = {}

        if (selectedArea.filled) {
          selected.color = 'rgba(194, 236, 203, 0.6)'
        } else {
          selected.color = 'rgba(226, 145, 145, 0.6)'
        }
      }

      return (
        <GridCol
          key={'Grid-col-' + i}
          isDragOverParent={isDragOverParent}
          selected={selected}
          col={col}
          onDragOver={onDragOver}
        />
      )
    })

    return gridCols
  }

  renderRows() {
    const {
      rows,
      selectedArea,
      isDragOver,
      onColDragOver
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
          {this.renderCols(row.cols, {
            isDragOverParent: isDragOver,
            selectedArea,
            onDragOver: onColDragOver
          })}
        </div>
      )
    })

    return gridRows
  }

  render () {
    let customStyle = this.props.style || {}

    const {
      baseWidth
    } = this.props

    const gridStyles = {
      ...customStyle,
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
  isDragOver: PropTypes.bool.isRequired,
  baseWidth: PropTypes.number.isRequired,
  rows: PropTypes.array.isRequired,
  selectedArea: PropTypes.object,
  onColDragOver: PropTypes.func
}

export default Grid
