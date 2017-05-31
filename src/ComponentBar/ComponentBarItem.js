import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import './ComponentBarItem.css'

const componentSource = {
  beginDrag (props, monitor, component) {
    if (props.onDragStart) {
      props.onDragStart(findDOMNode(component))
    }

    return props.component;
  },
  endDrag (props) {
    if (props.onDragEnd) {
      props.onDragEnd()
    }
  }
};

function collect (connect, monitor) {
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
     * IE/Edge does not support specifying images as the snapshot of a drag source so
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
        component
      } = this.props

      /**
       * drawing an invisible (transparent) element for drag preview, the element is invisible at
       * start because of absolute position an z-index: -1 (element is behind the content),
       * while dragging the element is invisible because the opacity is set to 0.
       * we need to apply different techniques at different stages to make the element invisible
       * because some browsers (Safari) needs that the element be visible
       * and with some content (can't be empty or just filled with empty space) before being screenshotted,
       * finally to make the invisible preview work we need to make the parent invisible (transparent) too
       * we do this in the render method
       */
      return (
        <div
          ref={(el) => this.emptyPreview = el}
          style={{
            backgroundColor: 'transparent',
            color: 'transparent',
            position: 'absolute',
            top: 0,
            left: 0
          }}
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
      isDragging,
      onMouseOver,
      onMouseLeave
    } = this.props

    return connectDragSource(
      // making the drag source invisible (transparent) while dragging, necessary to make
      // the invisible preview work in a cross-browser way,
      // while the drag source is invisible we insert a replacement (in ComponentBar)
      // to pretend that nothing has happened
      <div
        className="ComponentBarItem"
        onMouseOver={onMouseOver || null}
        onMouseLeave={onMouseLeave || null}
        style={{
          backgroundColor: isDragging ? 'transparent' : null ,
          color: isDragging ? 'transparent' : null,
          opacity: isDragging ? 0.99 : 1
        }}
      >
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
  isDragging: PropTypes.bool.isRequired,
  onMouseOver: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func
};

export default DragSource(ComponentTypes.COMPONENT_TYPE, componentSource, collect)(ComponentBarItem)
