import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import { DropTarget } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import DesignContainer from './DesignContainer'
import './Canvas.css'

const canvasTarget = {
  hover (props, monitor, component) {
    if (!monitor.isOver() && props.onDragEnter) {
      // first time hover
      props.onDragEnter({
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
        group: dropResult.group,
        item: monitor.getItem(),
        clientOffset: dropResult.clientOffset
      })
    }

    props.onDrop({
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
    this.onDragOver = throttle(
      this.onDragOver.bind(this),
      100,
      { leading: true }
    )

    this.isDraggingOver = this.isDraggingOver.bind(this)
    this.handleResizeItemStart = this.handleResizeItemStart.bind(this)
    this.handleResizeItemEnd = this.handleResizeItemEnd.bind(this)
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
          item: nextProps.item
        })
      }
    }

    if (this.props.item && !nextProps.item) {
      nextProps.onDragEnd && nextProps.onDragEnd({
        item: this.props.item
      })
    }
  }

  isDraggingOver () {
    return this.props.isDragOver
  }

  handleResizeItemStart (...args) {
    if (this.props.onResizeItemStart) {
      return this.props.onResizeItemStart(...args)
    }

    return
  }

  handleResizeItemEnd (...args) {
    if (this.props.onResizeItemEnd) {
      return this.props.onResizeItemEnd(...args)
    }

    return
  }

  onDragOver (params) {
    // ensuring that "onDragOver" is not being fired when
    // isDragOver is not true in Canvas.
    // this scenario is possible just because we are throttling the original
    // event ("onDragOver" in DesignGroup) and because of that we can have possible race conditions
    // between "onDragLeave" and "onDragOver"
    if (!this.props.isDragOver) {
      return
    }

    this.props.onDragOver && this.props.onDragOver(params)
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
      onDragOver,
      onClick,
      onClickComponent,
      onDragStartComponent,
      onRemoveComponent,
      onResizeItem
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
          onDragOver={onDragOver}
          onClickComponent={onClickComponent}
          onDragStartComponent={onDragStartComponent}
          onRemoveComponent={onRemoveComponent}
          onResizeItemStart={this.handleResizeItemStart}
          onResizeItem={onResizeItem}
          onResizeItemEnd={this.handleResizeItemEnd}
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
  onClick: PropTypes.func,
  onDragEnter: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragLeave: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func,
  onClickComponent: PropTypes.func,
  onDragStartComponent: PropTypes.func,
  onRemoveComponent: PropTypes.func,
  onResizeItemStart: PropTypes.func,
  onResizeItem: PropTypes.func,
  onResizeItemEnd: PropTypes.func
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, canvasTarget, collect)(Canvas);
