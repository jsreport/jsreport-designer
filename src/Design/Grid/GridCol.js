import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import { ComponentTypes } from '../../Constants'

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
    let canDrop = true

    if (
      props.isDraggingInParent() &&
      !props.col.empty
    ) {
      canDrop = false
    }

    return canDrop
  },

  drop (props, monitor, component) {
    let colNode = component.node

    let result = {
      col: props.col,
      colDimensions: colNode.getBoundingClientRect(),
      clientOffset: monitor.getClientOffset()
    }

    if (!props.onDropResult) {
      return result
    }

    return props.onDropResult(result)
  }
}

function collect (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget()
  }
}

class GridCol extends PureComponent {
  render () {
    const {
      col,
      connectDropTarget,
    } = this.props

    let colStyles = {
      width: col.width + col.unit,
      height: '100%'
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
  connectDropTarget: PropTypes.func.isRequired,
  isDraggingInParent: PropTypes.func.isRequired,
  onDragOver: PropTypes.func,
  onDropResult: PropTypes.func.isRequired
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, gridColTarget, collect)(GridCol);
