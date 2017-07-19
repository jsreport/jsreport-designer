import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import GridCol from './GridCol'

class GridRow extends PureComponent {
  constructor (props) {
    super(props)

    this.onRowDragOver = this.onRowDragOver.bind(this)
    this.onDropResult = this.onDropResult.bind(this)
  }

  onRowDragOver (colDragInfo) {
    const {
      row,
      onColDragOver
    } = this.props

    // adding row information to col drag information
    onColDragOver && onColDragOver({
      ...colDragInfo,
      row
    })
  }

  onDropResult (dropInfo) {
    return {
      row: this.props.row,
      ...dropInfo
    }
  }

  renderCols(cols) {
    const isDraggingInParent = this.props.isDraggingInParent
    const onRowDragOver = this.onRowDragOver
    const onDropResult = this.onDropResult

    let gridCols = cols.map((col) => {
      return (
        <GridCol
          key={col.id}
          col={col}
          isDraggingInParent={isDraggingInParent}
          onDragOver={onRowDragOver}
          onDropResult={onDropResult}
        />
      )
    })

    return gridCols
  }

  render () {
    const {
      row
    } = this.props

    const styles = {
      height: row.height + row.unit
    }

    if (row.placeholder === true) {
      styles.backgroundColor = 'rgba(87, 191, 216, 0.3)'
    }

    return (
      <div
        className="Grid-row"
        style={styles}
      >
        {this.renderCols(row.cols)}
      </div>
    )
  }
}

GridRow.propTypes = {
  row: PropTypes.object.isRequired,
  isDraggingInParent: PropTypes.func.isRequired,
  onColDragOver: PropTypes.func
}

export default GridRow
