import React, { Component } from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import { DropTarget } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import Grid from './Grid'
import ComponentItem from '../ComponentItem'
import './Canvas.css'

const canvasTarget = {
  hover (props, monitor) {
    if (!monitor.isOver() && props.onDragEnter) {
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
        col: dropResult.col
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

class Canvas extends Component {
  constructor (props) {
    super(props)

    // it is important to throttle the launching of the event to avoid having a
    // bad experience while dragging
    this.onColDragOver = throttle(
      this.onColDragOver.bind(this),
      180,
      { leading: true }
    )
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.item && nextProps.item && this.props.item.id === nextProps.item.id) {
      if (this.props.isDragOver === true &&
        !nextProps.isDragOver
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

  shouldShowGrid(gridRows) {
    if (gridRows.length > 0) {
      return true
    }

    return false
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

  renderComponentItem (componentItem) {
    return (
      <ComponentItem
        type={componentItem.componentType}
        width={componentItem.defaultSize.width}
        height={componentItem.defaultSize.height}
        componentProps={componentItem.props}
      />
    )
  }

  renderItems () {
    const {
      components
    } = this.props

    return (
      <div className="Canvas-area">
        {components.map((componentItem) => (
          <div
            key={'ComponentItem-' + componentItem.id}
            className="Canvas-area-item"
            style={{
              paddingLeft: `${(componentItem.position.left.col) * componentItem.colWidth}px`,
              paddingTop: `${(componentItem.position.top.row) * componentItem.colHeight}px`
            }}
          >
            {this.renderComponentItem(componentItem)}
          </div>
        ))}
      </div>
    )
  }

  render () {
    const {
      width,
      height,
      gridRows,
      selectedArea,
      filledArea,
      connectDropTarget,
      isDragOver,
      canDrop,
    } = this.props

    let canvasStyles = {
      width: width + 'px',
      height: height + 'px'
    }

    let gridStyles = {
      zIndex: -1
    }

    if (canDrop) {
      gridStyles.zIndex = 0
    }

    if (!isDragOver && canDrop) {
      canvasStyles.outline = '2px dotted #dede26'
    }

    if (isDragOver && canDrop) {
      canvasStyles.outline = '2px dotted rgb(168, 230, 79)'
      canvasStyles.borderColor = 'rgba(168, 230, 79, 0.3)'
    }

    return connectDropTarget(
      <div className="Canvas" style={canvasStyles}>
        {this.renderItems()}
        {this.shouldShowGrid(gridRows) && (
          <Grid
            isDragOver={isDragOver}
            baseWidth={width}
            rows={gridRows}
            selectedArea={selectedArea}
            filledArea={filledArea}
            style={gridStyles}
            onColDragOver={this.onColDragOver}
          />
        )}
      </div>
    )
  }
}

Canvas.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  gridRows: PropTypes.array.isRequired,
  selectedArea: PropTypes.object,
  filledArea: PropTypes.object,
  components: PropTypes.array.isRequired,
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
