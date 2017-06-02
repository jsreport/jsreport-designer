import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DragLayer } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import ComponentDragPreviewBox from './ComponentDragPreviewBox'
import './ComponentDragLayer.css'

function getPreviewLayerStyles (props) {
  const {
    item,
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
    initialPointerOffset.x - (initialSourceOffset.x + (item.defaultSize.width / 2))
  )

  let previewItemDistanceYRelativeToSource = (
    initialPointerOffset.y - (initialSourceOffset.y + (item.defaultSize.height / 2))
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
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialSourceOffset: monitor.getInitialSourceClientOffset(),
    initialPointerOffset: monitor.getInitialClientOffset(),
    currentSourceOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging()
  }
}

class ComponentDragLayer extends Component {
  renderPreview (type, item) {
    switch (type) {
      case ComponentTypes.COMPONENT_TYPE:
        return (
          <ComponentDragPreviewBox
            width={item.defaultSize.width}
            height={item.defaultSize.height}
            component={item}
          />
        )
      default:
        return
    }
  }

  render () {
    const {
      item,
      itemType,
      isDragging
    } = this.props

    if (!isDragging) {
      return null
    }

    return (
      <div className='ComponentDragLayer'>
        <div style={getPreviewLayerStyles(this.props)}>
          {this.renderPreview(itemType, item)}
        </div>
      </div>
    )
  }
}

ComponentDragLayer.propTypes = {
  item: PropTypes.object,
  itemType: PropTypes.string,
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
