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
    // if (!props.isDragOverParent) {
    //   return true
    // }

    return true
  },

  drop (props, monitor) {
    return {
      clientOffset: monitor.getClientOffset(),
      col: props.col
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
      col,
      selected,
      connectDropTarget,
    } = this.props

    let colStyles = {
      width: col.width + col.unit,
      height: '100%'
    }

    if (selected && selected.color) {
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
  connectDropTarget: PropTypes.func.isRequired,
  isDragOver: PropTypes.bool.isRequired,
  canDrop: PropTypes.bool.isRequired,
  onDragOver: PropTypes.func
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, gridColTarget, collect)(GridCol);
