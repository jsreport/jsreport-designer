import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import { DropTarget } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import DesignContainer from './DesignContainer'
import CanvasSelectedArea from './CanvasSelectedArea'
import Grid from './Grid'
import './Canvas.css'

const canvasTarget = {
  hover (props, monitor, component) {
    if (!monitor.isOver() && props.onDragEnter) {
      // getting canvas position when enter on canvas to later use it
      // when calculating the selected area position
      let position = component.canvasNode.getBoundingClientRect()

      component.canvasPosition = {
        top: position.top,
        left: position.left
      }

      // first time hover
      props.onDragEnter({
        item: monitor.getItem(),
        initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
        initialClientOffset: monitor.getInitialClientOffset(),
        clientOffset: monitor.getClientOffset()
      })
    }

    if (props.onDragOver) {
      props.onDragOver({
        item: monitor.getItem(),
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
        item: monitor.getItem(),
        clientOffset: dropResult.clientOffset,
        row: dropResult.row,
        col: dropResult.col,
        colDimensions: dropResult.colDimensions
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
    this.onColDragOver = throttle(
      this.onColDragOver.bind(this),
      100,
      { leading: true }
    )

    this.getCanvasNode = this.getCanvasNode.bind(this)
    this.getRelativePositionInsideCanvas = this.getRelativePositionInsideCanvas.bind(this)
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
      // cleaning canvas position when dragging ends
      this.canvasPosition = null

      nextProps.onDragEnd && nextProps.onDragEnd({
        item: this.props.item
      })
    }
  }

  getCanvasNode (el) {
    this.canvasNode = el
  }

  getRelativePositionInsideCanvas (areaPosition, topOrLeft) {
    let canvasPosition = this.canvasPosition
    let position

    if (!canvasPosition) {
      canvasPosition = this.canvasNode.getBoundingClientRect()

      canvasPosition = {
        top: canvasPosition.top,
        left: canvasPosition.left
      }
    }

    if (topOrLeft === 'top') {
      position = areaPosition - canvasPosition.top
    } else {
      position = areaPosition - canvasPosition.left
    }

    return position
  }

  shouldShowGrid(gridRows) {
    if (gridRows.length > 0) {
      return true
    }

    return false
  }

  isDraggingOver () {
    return this.props.isDragOver
  }

  handleResizeItemStart (...args) {
    let canvasDimensions = this.canvasNode.getBoundingClientRect()

    // getting canvas position when resizing is starting to later use it
    // when calculating the selected area position
    this.canvasPosition = {
      top: canvasDimensions.top,
      left: canvasDimensions.left
    }

    if (this.props.onResizeItemStart) {
      return this.props.onResizeItemStart(...args)
    }

    return
  }

  handleResizeItemEnd (...args) {
    // cleaning canvas position when resizing ends
    this.canvasPosition = null

    if (this.props.onResizeItemEnd) {
      return this.props.onResizeItemEnd(...args)
    }

    return
  }

  onColDragOver (params) {
    // ensuring that "onColDragOver" is not being fired when
    // isDragOver is not true in Canvas.
    // this scenario is possible just because we are throttling the original
    // event ("onColDragOver" in GridCol) and because of that we can have possible race conditions
    // between "onDragLeave" and "onColDragOver"
    if (!this.props.isDragOver) {
      return
    }

    this.props.onColDragOver && this.props.onColDragOver(params)
  }

  render () {
    const {
      width,
      height,
      numberOfCols,
      gridRows,
      selectedArea,
      designGroups,
      designSelection,
      connectDropTarget,
      isDragOver,
      canDrop,
      onClick,
      onClickComponent,
      onRemoveComponent,
      onResizeItem
    } = this.props

    let canvasStyles = {
      width: width + 'px',
      height: height + 'px'
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
        ref={this.getCanvasNode}
        style={canvasStyles}
        onClick={onClick}
        {...extraProps}
      >
        <DesignContainer
          baseWidth={width}
          numberOfCols={numberOfCols}
          selection={designSelection}
          groups={designGroups}
          onClickComponent={onClickComponent}
          onRemoveComponent={onRemoveComponent}
          onResizeItemStart={this.handleResizeItemStart}
          onResizeItem={onResizeItem}
          onResizeItemEnd={this.handleResizeItemEnd}
        />
        {this.shouldShowGrid(gridRows) && (
          <Grid
            canDrop={canDrop}
            baseWidth={width}
            rows={gridRows}
            isDraggingInParent={this.isDraggingOver}
            onColDragOver={this.onColDragOver}
          />
        )}
        {selectedArea && (
          <CanvasSelectedArea
            width={selectedArea.areaBox.width}
            height={selectedArea.areaBox.height}
            top={this.getRelativePositionInsideCanvas(selectedArea.areaBox.top, 'top')}
            left={this.getRelativePositionInsideCanvas(selectedArea.areaBox.left, 'left')}
            isValid={!selectedArea.conflict && selectedArea.filled}
          />
        )}
      </div>
    )
  }
}

Canvas.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  numberOfCols: PropTypes.number.isRequired,
  gridRows: PropTypes.array.isRequired,
  selectedArea: PropTypes.object,
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
  onColDragOver: PropTypes.func,
  onClickComponent: PropTypes.func,
  onRemoveComponent: PropTypes.func,
  onResizeItemStart: PropTypes.func,
  onResizeItem: PropTypes.func,
  onResizeItemEnd: PropTypes.func
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, canvasTarget, collect)(Canvas);
