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
    isDragging: monitor.isDragging()
  }
}

class ComponentBarItem extends Component {
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
      </div>
    )
  }
}

ComponentBarItem.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired
};

export default DragSource(ComponentTypes.COMPONENT_TYPE, componentSource, collect)(ComponentBarItem)
