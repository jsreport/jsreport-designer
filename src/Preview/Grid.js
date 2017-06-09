import React, { Component } from 'react'
import PropTypes from 'prop-types'
import GridCol from './GridCol'
import './Grid.css'

class Grid extends Component {
  renderCols(cols, { isDragOverParent, selectedArea, filledArea, onDragOver }) {
    let gridCols = cols.map((col, i) => {
      let coord = col.index + ',' + col.row
      let selected = null

      if (
        selectedArea &&
        selectedArea.area[coord] != null
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
          filledArea={filledArea}
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
      filledArea,
      isDragOver,
      onColDragOver
    } = this.props

    const canDropOnCol = this.canDropOnCol

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
            canDropOnCol,
            selectedArea,
            filledArea,
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
  filledArea: PropTypes.object,
  onColDragOver: PropTypes.func
}

export default Grid
