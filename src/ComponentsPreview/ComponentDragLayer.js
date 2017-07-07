import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DragLayer } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import ComponentDragPreviewBox from './ComponentDragPreviewBox'
import './ComponentDragLayer.css'

function getPreviewLayerStyles (props) {
  const {
    componentMeta,
    initialSourceOffset,
    currentSourceOffset,
    initialPointerOffset
  } = props

  if (!initialSourceOffset || !initialPointerOffset || !currentSourceOffset) {
    return {
      display: 'none'
    }
  }

  let movementX, movementY

  let previewItemDistanceXRelativeToSource = (
    initialPointerOffset.x - (initialSourceOffset.x + (componentMeta.defaultSize.width / 2))
  )

  let previewItemDistanceYRelativeToSource = (
    initialPointerOffset.y - (initialSourceOffset.y + (componentMeta.defaultSize.height / 2))
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
      styles = getPreviewLayerStyles(this.props)
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
