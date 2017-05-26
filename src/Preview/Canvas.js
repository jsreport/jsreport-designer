import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import { ComponentTypes } from '../Constants'
import Grid from './Grid'
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
  shouldShowGrid(grid) {
    if (grid && grid.rows != null && grid.cols != null) {
      return true
    }

    return false
  }

  renderComponent (comp) {
    // default content for now
    let content = comp.componentType + '-' + comp.id

    // create here some logic to create a component depending of the component type
    if (comp.componentType === 'Text') {
      // faking getting component content, just for now
      content = '<span>' + comp.props.text + '</span>'
    } else if (comp.componentType === 'Image') {
      // faking getting component content, just for now
      content = '<img src="' + comp.props.url +  '" style="width: ' + comp.props.width + '; height: ' + comp.props.height + '" />'
    } else {
      // default fake content
      content = '<span>' + content + '</span>'
    }

    return (
      <div
        style={{
          display: 'inline-block',
          border: '1px dashed rgba(0, 0, 0, 0.3)'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )

    {/* <div
      style={{
        display: 'inline-block',
        border: '1px dashed rgba(0, 0, 0, 0.3)'
      }}
    >
      {content}
    </div> */}
  }

  renderItems () {
    const {
      components
    } = this.props

    return (
      <div className="Canvas-area">
        {components.map((comp) => (
          <div
            key={'Component-' + comp.id}
            className="Canvas-area-position"
            style={{
              top: comp.position.top,
              left: comp.position.left
            }}
          >
            {this.renderComponent(comp)}
          </div>
        ))}
      </div>
    )
  }

  render () {
    const {
      width,
      height,
      grid,
      connectDropTarget,
      isOver,
      canDrop
    } = this.props

    let canvasStyles = {
      width,
      height
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
        {this.shouldShowGrid(grid) && (
          <Grid
            baseWidth={width}
            baseHeight={height}
            rows={grid.rows}
            cols={grid.cols}
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
  grid: PropTypes.shape({
    rows: PropTypes.number,
    cols: PropTypes.number
  }),
  components: PropTypes.array.isRequired,
  canDrop: PropTypes.bool.isRequired,
  isOver: PropTypes.bool.isRequired
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, canvasTarget, collect)(Canvas);
