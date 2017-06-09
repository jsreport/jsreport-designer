import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import { ComponentTypes } from '../Constants'

const gridColTarget = {
  hover (props, monitor, component) {
    let col = props.col
    let colNode = component.node
    let item = monitor.getItem()

    if (props.onDragOver) {
      props.onDragOver({
        col,
        colDimensions: colNode.getBoundingClientRect(),
        item,
        clientOffset: monitor.getClientOffset()
      })
    }
  },

  canDrop (props, monitor) {
    let { col } = props
    let canDrop = true

    if (
      props.isDragOverParent &&
      props.filledArea &&
      props.filledArea[col.index + ',' + col.row]
    ) {
      canDrop = false
    }

    return canDrop
  },

  drop (props, monitor, component) {
    let colDimensions = component.node.getBoundingClientRect()

    return {
      clientOffset: monitor.getClientOffset(),
      col: {
        info: props.col,
        dimensions: {
          width: colDimensions.width,
          height: colDimensions.height
        }
      }
    }
  }
}

function collect (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isDragOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  }
}

class GridCol extends Component {
  render () {
    const {
      canDrop,
      col,
      selected,
      connectDropTarget,
    } = this.props

    let colStyles = {
      width: col.width + col.unit,
      height: '100%'
    }

    if (canDrop && selected && selected.color) {
      colStyles.backgroundColor = selected.color
    }

    return connectDropTarget(
      <div
        ref={(el) => this.node = el}
        className="Grid-col"
        style={colStyles}
      />
    )
  }
}

GridCol.propTypes = {
  col: PropTypes.object.isRequired,
  isDragOverParent: PropTypes.bool.isRequired,
  selected: PropTypes.shape({
    color: PropTypes.string
  }),
  filledArea: PropTypes.object,
  connectDropTarget: PropTypes.func.isRequired,
  isDragOver: PropTypes.bool.isRequired,
  canDrop: PropTypes.bool.isRequired,
  onDragOver: PropTypes.func
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, gridColTarget, collect)(GridCol);
