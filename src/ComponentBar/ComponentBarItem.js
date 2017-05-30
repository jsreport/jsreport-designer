import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import './ComponentBarItem.css'

const componentSource = {
  beginDrag(props) {
    return props.component;
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  }
}

class ComponentBarItem extends Component {
  componentDidMount () {
    /**
     * Use empty element as a drag preview so browsers don't draw it
     * and we can draw whatever we want on the custom drag layer instead.
     * we could have used the `.getEmptyImage()` of react-dnd-html5-backend but
     * IE does not support specifying images as the snapshot of a drag source so
     * we use the cross-browser solution: an invisible element,
     * we also use the `captureDraggingState` for our preview element to receive the
     * isDragging state as fast as possible
     */
    this.props.connectDragPreview(this.getEmptyPreview(), {
      captureDraggingState: true
    });
  }

  getEmptyPreview (createElement) {
    if (createElement === true) {
      const {
        isDragging,
        component
      } = this.props

      /**
       * drawing an invisible element for drag preview, the element is invisible at
       * start because of absolute position an z-index: -1 (element is behind the content),
       * while dragging the element is invisible because the opacity is set to 0.
       * we need to apply different techniques at different stages to make the element invisible
       * because some browsers (Safari) needs that the element be visible before being screenshotted,
       * also the element needs to have some content (can't be empty or just filled with empty space)
       */
      return (
        <div
          ref={(el) => this.emptyPreview = el}
          style={{ position: 'absolute', top: 0, left: 0, opacity: isDragging ? 0 : 1, zIndex: -1 }}
        >
          {`Preview-${component.name}`}
        </div>
      )
    }

    return this.emptyPreview
  }

  render () {
    const {
      component,
      connectDragSource,
      isDragging
    } = this.props

    return connectDragSource(
      <div className="ComponentBarItem" style={{ opacity: isDragging ? 0.7 : 1 }}>
        <span className={'ComponentBarItem-icon fa fa-' + component.icon} />
        <span className="ComponentBarItem-name">{component.name}</span>
        {this.getEmptyPreview(true)}
      </div>
    )
  }
}

ComponentBarItem.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDragPreview: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired
};

export default DragSource(ComponentTypes.COMPONENT_TYPE, componentSource, collect)(ComponentBarItem)
