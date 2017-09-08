import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import { DropTarget } from 'react-dnd'
import { ComponentDragTypes } from '../Constants'
import DesignContainer from './DesignContainer'
import './Canvas.css'

const canvasTarget = {
  hover (props, monitor, component) {
    if (!monitor.isOver() && props.onDragEnter) {
      component.currentDragType = monitor.getItemType()

      // first time hover
      props.onDragEnter({
        dragType: component.currentDragType,
        item: monitor.getItem(),
        initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
        initialClientOffset: monitor.getInitialClientOffset(),
        clientOffset: monitor.getClientOffset()
      })
    }
  },

  drop (props, monitor, component) {
    const hasDroppedOnChild = monitor.didDrop();

    if (!props.onDrop) {
      return
    }

    if (hasDroppedOnChild) {
      let dropResult = monitor.getDropResult()

      return props.onDrop({
        dragType: component.currentDragType,
        canvasInfo: dropResult.canvasInfo,
        item: monitor.getItem(),
        clientOffset: dropResult.clientOffset
      })
    }

    props.onDrop({
      dragType: component.currentDragType,
      item: monitor.getItem(),
      clientOffset: monitor.getClientOffset()
    })
  }
}

function collect (connect, monitor) {
  return {
    item: monitor.getItem(),
    connectDropTarget: connect.dropTarget(),
    isDragOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  }
}

class Canvas extends PureComponent {
  constructor (props) {
    super(props)

    // it is important to throttle the launching of the event to avoid having a
    // bad experience while dragging
    this.handleDragOver = throttle(
      this.handleDragOver.bind(this),
      100,
      { leading: true }
    )

    this.currentDragType = null

    this.isDraggingOver = this.isDraggingOver.bind(this)
    this.handleItemResizeStart = this.handleItemResizeStart.bind(this)
    this.handleItemResizeEnd = this.handleItemResizeEnd.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.item && nextProps.item && this.props.item.id === nextProps.item.id) {
      if (
        (this.props.isDragOver === true && !nextProps.isDragOver) &&
        // ensure that we don't fire the event when dropping
        // (when dropping canDrop changes to false)
        (this.props.canDrop === true && nextProps.canDrop === true)
      ) {
        nextProps.onDragLeave && nextProps.onDragLeave({
          dragType: this.currentDragType,
          item: nextProps.item
        })
      }
    }

    if (this.props.item && !nextProps.item) {
      nextProps.onDragEnd && nextProps.onDragEnd({
        dragType: this.currentDragType,
        item: this.props.item
      })
    }
  }

  isDraggingOver () {
    return this.props.isDragOver
  }

  handleItemResizeStart (...args) {
    if (this.props.onItemResizeStart) {
      return this.props.onItemResizeStart(...args)
    }

    return
  }

  handleItemResizeEnd (...args) {
    if (this.props.onItemResizeEnd) {
      return this.props.onItemResizeEnd(...args)
    }

    return
  }

  handleDragOver (params) {
    // ensuring that "onDragOver" is not being fired when
    // isDragOver is not true in Canvas.
    // this scenario is possible just because we are throttling the original
    // event ("onDragOver" in DesignGroup) and because of that we can have possible race conditions
    // between "onDragLeave" and "onDragOver"
    if (!this.props.isDragOver) {
      return
    }

    this.props.onDragOver && this.props.onDragOver({
      dragType: this.currentDragType,
      ...params
    })
  }

  render () {
    const {
      baseWidth,
      numberOfCols,
      emptyGroupHeight,
      designGroups,
      designSelection,
      highlightedArea,
      connectDropTarget,
      isDragOver,
      canDrop,
      getDataInput,
      onClick,
      onComponentClick,
      onComponentDragStart,
      onComponentRemove,
      onItemResize
    } = this.props

    let canvasStyles = {
      width: baseWidth + 'px'
    }

    let extraProps = {}

    if (!isDragOver && canDrop) {
      extraProps['data-dragging'] = true
    }

    if (isDragOver && canDrop) {
      extraProps['data-can-drop'] = true
    }

    return connectDropTarget(
      <div
        className="Canvas"
        style={canvasStyles}
        onClick={onClick}
        {...extraProps}
      >
        <DesignContainer
          baseWidth={baseWidth}
          numberOfCols={numberOfCols}
          emptyGroupHeight={emptyGroupHeight}
          dragging={canDrop}
          selection={designSelection}
          highlightedArea={highlightedArea}
          groups={designGroups}
          getDataInput={getDataInput}
          onDragOver={this.handleDragOver}
          onComponentClick={onComponentClick}
          onComponentDragStart={onComponentDragStart}
          onComponentRemove={onComponentRemove}
          onItemResizeStart={this.handleItemResizeStart}
          onItemResize={onItemResize}
          onItemResizeEnd={this.handleItemResizeEnd}
        />
      </div>
    )
  }
}

Canvas.propTypes = {
  baseWidth: PropTypes.number.isRequired,
  numberOfCols: PropTypes.number.isRequired,
  emptyGroupHeight: PropTypes.number.isRequired,
  highlightedArea: PropTypes.object,
  designGroups: PropTypes.array.isRequired,
  designSelection: PropTypes.object,
  connectDropTarget: PropTypes.func.isRequired,
  canDrop: PropTypes.bool.isRequired,
  isDragOver: PropTypes.bool.isRequired,
  getDataInput: PropTypes.func,
  onClick: PropTypes.func,
  onDragEnter: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragLeave: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func,
  onComponentClick: PropTypes.func,
  onComponentDragStart: PropTypes.func,
  onComponentRemove: PropTypes.func,
  onItemResizeStart: PropTypes.func,
  onItemResize: PropTypes.func,
  onItemResizeEnd: PropTypes.func
}

export default DropTarget([
  ComponentDragTypes.COMPONENT_TYPE,
  ComponentDragTypes.COMPONENT,
], canvasTarget, collect)(Canvas);
