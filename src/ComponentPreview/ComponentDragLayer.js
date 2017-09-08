import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DragLayer } from 'react-dnd'
import { ComponentDragTypes } from '../Constants'
import ComponentDragPreviewBox from './ComponentDragPreviewBox'
import './ComponentDragLayer.css'

function getDragLayerStyles (dragItemType, props) {
  const {
    initialSourceOffset,
    currentSourceOffset,
    initialPointerOffset
  } = props

  let pointerPosition = {
    x: 0,
    y: 0
  }

  if (!initialSourceOffset || !initialPointerOffset || !currentSourceOffset) {
    return {
      display: 'none'
    }
  }

  if (props.componentMeta.pointerPreviewPosition) {
    pointerPosition = props.componentMeta.pointerPreviewPosition
  } else {
    pointerPosition = {
      x: initialPointerOffset.x - initialSourceOffset.x,
      y: initialPointerOffset.y - initialSourceOffset.y
    }
  }

  let movementX, movementY

  let previewItemDistanceXRelativeToSource = (
    initialPointerOffset.x - (initialSourceOffset.x + pointerPosition.x)
  )

  let previewItemDistanceYRelativeToSource = (
    initialPointerOffset.y - (initialSourceOffset.y + pointerPosition.y)
  )

  movementX = currentSourceOffset.x + previewItemDistanceXRelativeToSource
  movementY = currentSourceOffset.y + previewItemDistanceYRelativeToSource

  const transform = `translate(${movementX}px, ${movementY}px)`

  return {
    transform,
    WebkitTransform: transform,
    MsTransform: transform
  }
}

function collect (monitor) {
  return {
    componentMeta: monitor.getItem(),
    dragItemType: monitor.getItemType(),
    initialSourceOffset: monitor.getInitialSourceClientOffset(),
    initialPointerOffset: monitor.getInitialClientOffset(),
    currentSourceOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging()
  }
}

class ComponentDragLayer extends Component {
  renderPreview (dataInput, dragItemType, colWidth, componentMeta) {
    switch (dragItemType) {
      case ComponentDragTypes.COMPONENT_TYPE:
      case ComponentDragTypes.COMPONENT:
        return (
          <ComponentDragPreviewBox
            dataInput={dataInput}
            width={colWidth * (componentMeta.consumedCols != null ? componentMeta.consumedCols : 1)}
            componentMeta={componentMeta}
          />
        )
      default:
        return
    }
  }

  render () {
    const {
      dataInput,
      colWidth,
      componentMeta,
      dragItemType,
      isDragging
    } = this.props

    let styles

    if (!isDragging) {
      styles = {
        display: 'none'
      }
    } else {
      styles = getDragLayerStyles(dragItemType, this.props)
    }

    return (
      <div className='ComponentDragLayer'>
        <div style={styles}>
          {isDragging && this.renderPreview(dataInput, dragItemType, colWidth, componentMeta)}
        </div>
      </div>
    )
  }
}

ComponentDragLayer.propTypes = {
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  colWidth: PropTypes.number.isRequired,
  componentMeta: PropTypes.object,
  dragItemType: PropTypes.string,
  initialSourceOffset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  initialPointerOffset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  currentSourceOffset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  isDragging: PropTypes.bool.isRequired
}

export default DragLayer(collect)(ComponentDragLayer)
