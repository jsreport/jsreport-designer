import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import Grid from './Grid'
import ComponentItem from '../ComponentItem'
import './Canvas.css'

function logMonitorData(monitor) {
  console.group('DROP ACTION')
  console.group('INITIAL')
  console.log('getInitialSourceClientOffset() -> ' + JSON.stringify(monitor.getInitialSourceClientOffset()))
  console.log('getInitialClientOffset() -> ' + JSON.stringify(monitor.getInitialClientOffset()))
  console.groupEnd('INITIAL')
  console.group('LAST')
  console.log('getClientOffset() -> ' + JSON.stringify(monitor.getClientOffset()))
  console.log('getDifferenceFromInitialOffset() -> ' + JSON.stringify(monitor.getDifferenceFromInitialOffset()))
  console.groupEnd('LAST')
  console.group('PROJECTED')
  console.log('getSourceClientOffset() -> ' + JSON.stringify(monitor.getSourceClientOffset()))
  console.groupEnd('PROJECTED')
  console.groupEnd('DROP ACTION')
}

const canvasTarget = {
  hover (props, monitor) {
    if (!monitor.isOver()) {
      // first time hover
      props.onBeginHover({
        item: monitor.getItem(),
        initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
        initialClientOffset: monitor.getInitialClientOffset(),
        clientOffset: monitor.getClientOffset()
      })

      logMonitorData(monitor)
    }

    if (props.onHover) {
      props.onHover({
        item: monitor.getItem(),
        clientOffset: monitor.getClientOffset()
      })
    }
  },

  drop (props, monitor) {
    props.onDrop({
      item: monitor.getItem(),
      clientOffset: monitor.getClientOffset()
    })
  }
}

function collect (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  }
}

class Canvas extends Component {
  shouldShowGrid(gridRows) {
    if (gridRows.length > 0) {
      return true
    }

    return false
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
            className="Canvas-area-position"
            style={{
              top: componentItem.position.top,
              left: componentItem.position.left
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
      connectDropTarget,
      isOver,
      canDrop
    } = this.props

    let canvasStyles = {
      width: width + 'px',
      height: height + 'px'
    }

    if (!isOver && canDrop) {
      canvasStyles.outline = '2px dotted #dede26'
    }

    if (isOver && canDrop) {
      canvasStyles.outline = '2px dotted rgb(168, 230, 79)'
      canvasStyles.borderColor = 'rgba(168, 230, 79, 0.3)'
    }

    return connectDropTarget(
      <div className="Canvas" style={canvasStyles}>
        {this.shouldShowGrid(gridRows) && (
          <Grid
            baseWidth={width}
            rows={gridRows}
          />
        )}
        {this.renderItems()}
      </div>
    )
  }
}

Canvas.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  gridRows: PropTypes.array.isRequired,
  components: PropTypes.array.isRequired,
  canDrop: PropTypes.bool.isRequired,
  isOver: PropTypes.bool.isRequired
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, canvasTarget, collect)(Canvas);
