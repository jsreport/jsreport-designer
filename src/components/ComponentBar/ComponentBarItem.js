import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import { ComponentDragTypes } from '../../Constants'
import './ComponentBarItem.css'

const componentTypeSource = {
  beginDrag (props, monitor, component) {
    if (props.onDragStart) {
      return props.onDragStart(props.componentType, component.node)
    }

    return {}
  },

  endDrag (props, monitor, component) {
    let intialSourceOffset = monitor.getInitialSourceClientOffset()
    let currentOffset = monitor.getClientOffset()
    let cursorOver = false
    let itemDimensions

    if (intialSourceOffset && currentOffset) {
      itemDimensions = component.node.getBoundingClientRect()

      // if after dragging the cursor is still over the item then
      // update the state to reflect that
      cursorOver = (
        (
          intialSourceOffset.x <= currentOffset.x &&
          currentOffset.x <= intialSourceOffset.x + itemDimensions.width
        ) &&
        (
          intialSourceOffset.y <= currentOffset.y &&
          currentOffset.y <= intialSourceOffset.y + itemDimensions.height
        )
      )
    }

    if (cursorOver) {
      component.setState({ isOver: true })
    } else {
      // clean over state inmediatly after dragging has ended
      if (component.state.isOver) {
        component.setState({ isOver: false })
      }
    }

    if (props.onDragEnd) {
      props.onDragEnd(props.componentType)
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
  constructor (props) {
    super(props)

    this.state = {
      isOver: false
    }

    this.node = null
    this.tmpNode = null

    this.setNode = this.setNode.bind(this)
    this.connectToDragSourceConditionally = this.connectToDragSourceConditionally.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }

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

  setNode (el) {
    this.node = el
  }

  getEmptyPreview (createElement) {
    if (createElement === true) {
      const {
        componentType
      } = this.props

      /**
       * drawing an invisible (transparent) element for drag preview,
       * while dragging the element is invisible because the opacity is set to 0.99.
       * we need to apply different techniques at different stages to make the element invisible
       * because some browsers (Safari) needs that the element be visible
       * and with some content (can't be empty or just filled with empty space) before being screenshotted,
       * finally to make the invisible preview work we need to make the parent invisible (transparent) too
       * we do that in the render method
       */
      return (
        <div
          ref={(el) => this.emptyPreview = el}
          style={{
            backgroundColor: 'transparent',
            color: 'transparent',
            position: 'absolute',
            top: -100,
            left: -100
          }}
        >
          {`DragPreview-${componentType.name}`}
        </div>
      )
    }

    return this.emptyPreview
  }

  getTemporalNode () {
    if (this.tmpNode) {
      return this.tmpNode
    }

    this.tmpNode = document.createElement('div')
    return this.tmpNode
  }

  connectToDragSourceConditionally (...args) {
    const connectDragSource = this.props.connectDragSource
    let element

    if (this.props.isDragging) {
      // while dragging we change the drag source to a temporal node that it is not attached to the DOM,
      // this is needed to instruct react-dnd that it should cancel the default dragend's animation (snap back of item)
      connectDragSource.apply(undefined, [this.getTemporalNode(), ...args.slice(1)])
      element = args[0]
    } else {
      element = connectDragSource.apply(undefined, args)
    }

    return element
  }

  onMouseOver (ev) {
    this.setState({
      isOver: true
    })

    if (this.props.onMouseOver) {
      this.props.onMouseOver(ev)
    }
  }

  onMouseLeave (ev) {
    if (this.state.isOver) {
      this.setState({
        isOver: false
      })
    }

    if (this.props.onMouseLeave) {
      this.props.onMouseLeave(ev)
    }
  }

  render () {
    let connectToDragSourceConditionally = this.connectToDragSourceConditionally

    const {
      isOver
    } = this.state

    const {
      componentType,
      isDragging
    } = this.props

    let extraProps = {}

    if (isOver) {
      extraProps['data-over'] = true
    }

    return connectToDragSourceConditionally(
      // making the drag source invisible (transparent) while dragging, necessary to make
      // the invisible preview work in a cross-browser way,
      // while the drag source is invisible we insert a replacement (in ComponentBar)
      // to pretend that nothing has happened.
      //
      // we also are not using any css :hover style applied to the drag source item,
      // this has been intentionally avoided because html5 drag and drop has style issues (cursor, background styles)
      // when some styles are applied directly using :hover,
      // we apply the style to the item on the javascript events instead
      <div
        ref={this.setNode}
        className="ComponentBarItem"
        onMouseOver={this.onMouseOver}
        onMouseLeave={this.onMouseLeave}
        style={{
          // when dragging we move the item just a little back to be able to cancel
          // the default snap back animation of the browser when dragging ends, we care about this
          // because the animation causes that the "dragend" event is delayed until the animation is finished,
          // which leads to feel the interaction somehow slow.
          // the rule of thumb is: if the drag source node has changed its position while the dragging
          // then the animation is not show
          top: isDragging ? -0.1 : null,
          backgroundColor: isDragging ? 'transparent' : null,
          // we apply the pointer style on mouse over event to prevent the cursor to stay the same
          // when dropping
          cursor: isOver && !isDragging ? 'pointer' : 'default',
          color: isDragging ? 'transparent' : null,
          opacity: isDragging ? 0.99 : null
        }}
        {...extraProps}
      >
        <span className={'ComponentBarItem-icon fa fa-' + componentType.icon} />
        <span className="ComponentBarItem-name">{componentType.name}</span>
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
  onDragEnd: PropTypes.func,
  componentType: PropTypes.object.isRequired
};

export default DragSource(ComponentDragTypes.COMPONENT_TYPE, componentTypeSource, collect)(ComponentBarItem)
