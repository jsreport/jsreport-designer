import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DragLayer } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import ComponentDragPreviewBox from './ComponentDragPreviewBox'
import './ComponentDragLayer.css'

function getDragLayerStyles (dragItemType, props) {
  const {
    initialSourceOffset,
    currentSourceOffset,
    initialPointerOffset
  } = props

  let itemWidth = 0
  let itemHeight = 0

  if (!initialSourceOffset || !initialPointerOffset || !currentSourceOffset) {
    return {
      display: 'none'
    }
  }

  itemWidth = props.componentMeta.size.width
  itemHeight = props.componentMeta.size.height

  let movementX, movementY

  let previewItemDistanceXRelativeToSource = (
    initialPointerOffset.x - (initialSourceOffset.x + (itemWidth / 2))
  )

  let previewItemDistanceYRelativeToSource = (
    initialPointerOffset.y - (initialSourceOffset.y + (itemHeight / 2))
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
  renderPreview (dragItemType, defaultWidth, componentMeta) {
    switch (dragItemType) {
      case ComponentTypes.COMPONENT_TYPE:
      case ComponentTypes.COMPONENT:
        return (
          <ComponentDragPreviewBox
            defaultWidth={defaultWidth}
            componentMeta={componentMeta}
          />
        )
      default:
        return
    }
  }

  render () {
    const {
      defaultWidth,
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
          {isDragging && this.renderPreview(dragItemType, defaultWidth, componentMeta)}
        </div>
      </div>
    )
  }
}

ComponentDragLayer.propTypes = {
  defaultWidth: PropTypes.number.isRequired,
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
