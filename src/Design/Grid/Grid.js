import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import GridRow from './GridRow'
import './Grid.css'

class GridContent extends PureComponent {
  render () {
    const {
      rows,
      isDraggingInParent,
      onColDragOver
    } = this.props

    return (
      <div className="Grid-content">
        {rows.map((row) => {
          return (
            <GridRow
              key={'Grid-row-' + row.id}
              row={row}
              isDraggingInParent={isDraggingInParent}
              onColDragOver={onColDragOver}
            />
          )
        })}
      </div>
    )
  }
}

class Grid extends PureComponent {
  render () {
    const {
      canDrop,
      baseWidth,
      rows,
      isDraggingInParent,
      onColDragOver
    } = this.props

    const gridStyles = {
      width: baseWidth,
      zIndex: -1
    }

    if (canDrop) {
      gridStyles.zIndex = 1
    }

    return (
      <div className="Grid" style={gridStyles}>
        <GridContent
          rows={rows}
          isDraggingInParent={isDraggingInParent}
          onColDragOver={onColDragOver}
        />
      </div>
    )
  }
}

Grid.propTypes = {
  canDrop: PropTypes.bool.isRequired,
  baseWidth: PropTypes.number.isRequired,
  rows: PropTypes.array.isRequired,
  isDraggingInParent: PropTypes.func.isRequired,
  onColDragOver: PropTypes.func
}

export default Grid
