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
      // getting canvas position when enter on canvas
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

  drop (props, monitor) {
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

    this.getRelativePositionInsideCanvas = this.getRelativePositionInsideCanvas.bind(this)
    this.isDraggingOver = this.isDraggingOver.bind(this)
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

  getRelativePositionInsideCanvas (areaPosition, topOrLeft) {
    const canvasPosition = this.canvasPosition
    let position

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
      connectDropTarget,
      isDragOver,
      canDrop,
    } = this.props

    let canvasStyles = {
      width: width + 'px',
      height: height + 'px'
    }

    if (!isDragOver && canDrop) {
      canvasStyles.outline = '2px dotted #dede26'
    }

    if (isDragOver && canDrop) {
      canvasStyles.outline = '2px dotted rgb(168, 230, 79)'
      canvasStyles.borderColor = 'rgba(168, 230, 79, 0.3)'
    }

    return connectDropTarget(
      <div className="Canvas" ref={(el) => this.canvasNode = el} style={canvasStyles}>
        <DesignContainer
          baseWidth={width}
          numberOfCols={numberOfCols}
          designGroups={designGroups}
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
  connectDropTarget: PropTypes.func.isRequired,
  canDrop: PropTypes.bool.isRequired,
  isDragOver: PropTypes.bool.isRequired,
  onDragEnter: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragLeave: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func,
  onColDragOver: PropTypes.func
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, canvasTarget, collect)(Canvas);
