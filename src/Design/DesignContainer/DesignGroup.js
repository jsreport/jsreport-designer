import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import { ComponentDragTypes } from '../../Constants'
import Grid from '../Grid'
import DesignItem from './DesignItem'
import './DesignGroup.css'

const groupTarget = {
  hover (props, monitor, component) {
    let groupNode = component.node
    let groupDimensions = groupNode.getBoundingClientRect()
    let item = monitor.getItem()
    let clientOffset = monitor.getClientOffset()

    if (!monitor.isOver()) {
      component.draggingStart = Date.now()
    }

    // don't fire the event until the cursor is over the group
    if (
      clientOffset.x < groupDimensions.left ||
      clientOffset.y < groupDimensions.top
    ) {
      return
    }

    // show dragging over styles after 200ms of beign over the group
    if (
      (Date.now() - component.draggingStart) > 200 &&
      !component.state.isDraggingOver
    ) {
      component.setState({
        isDraggingOver: true
      })
    }

    if (props.onDragOver) {
      props.onDragOver({
        canvasInfo: {
          group: component.getIndex(),
          // taking the index from the value saved in design item's dragEnter
          item: component.draggingInDesignItem,
          groupDimensions
        },
        item,
        clientOffset
      })
    }
  },

  drop (props, monitor, component) {
    let result = {
      canvasInfo: {
        group: component.getIndex(),
        // taking the index from drop result of design item
        item: monitor.didDrop() ? monitor.getDropResult().itemIndex : null
      },
      clientOffset: monitor.getClientOffset()
    }

    component.draggingInDesignItem = null

    return result
  }
}

function collect (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  }
}

class DesignGroup extends PureComponent {
  constructor (props) {
    super(props)

    this.itemsIndexCache = null
    this.draggingInDesignItem = null
    this.draggingStart = null

    this.state = {
      isDraggingOver: false
    }

    this.getIndexOfItem = this.getIndexOfItem.bind(this)
    this.getIndex = this.getIndex.bind(this)
    this.getNode = this.getNode.bind(this)
    this.handleItemResizeStart = this.handleItemResizeStart.bind(this)
    this.handleItemResize = this.handleItemResize.bind(this)
    this.handleItemResizeEnd = this.handleItemResizeEnd.bind(this)
    this.handleItemDragEnter = this.handleItemDragEnter.bind(this)
    this.handleItemDragLeave = this.handleItemDragLeave.bind(this)
    this.handleComponentDragStart = this.handleComponentDragStart.bind(this)
    this.handleComponentRemove = this.handleComponentRemove.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.isOver && !nextProps.isOver) {
      this.draggingStart = null

      this.setState({
        isDraggingOver: false
      })
    }
  }

  getNode (el) {
    this.node = el
  }

  getIndex () {
    return this.props.getIndex(this.props.id)
  }

  getIndexOfItem (itemId) {
    return this.itemsIndexCache[itemId]
  }

  handleItemResizeStart (args) {
    if (this.props.onItemResizeStart) {
      return this.props.onItemResizeStart({
        ...args,
        group: this.getIndex()
      })
    }
  }

  handleItemResize (args) {
    if (this.props.onItemResize) {
      return this.props.onItemResize({
        ...args,
        group: this.getIndex()
      })
    }
  }

  handleItemResizeEnd (args) {
    if (this.props.onItemResizeEnd) {
      return this.props.onItemResizeEnd({
        ...args,
        group: this.getIndex()
      })
    }
  }

  handleItemDragEnter ({ itemIndex }) {
    this.draggingInDesignItem = itemIndex
  }

  handleItemDragLeave ({ itemIndex }) {
    if (this.draggingInDesignItem === itemIndex) {
      this.draggingInDesignItem = null
    }
  }

  handleComponentDragStart (componentInfo, componentNode) {
    if (this.props.onComponentDragStart) {
      return this.props.onComponentDragStart({
        ...componentInfo,
        group: this.getIndex()
      }, componentNode)
    }
  }

  handleComponentRemove (args) {
    if (this.props.onComponentRemove) {
      this.props.onComponentRemove({
        ...args,
        group: this.getIndex()
      })
    }
  }

  render () {
    const { isDraggingOver } = this.state

    let {
      baseWidth,
      numberOfCols,
      emptyGroupHeight,
      showTopBorder,
      placeholder,
      layoutMode,
      selection,
      items,
      onComponentClick,
      connectDropTarget
    } = this.props

    let styles = {}
    let extraProps = {}

    if (placeholder === true) {
      styles.backgroundColor = 'rgba(87, 191, 216, 0.3)'
    }

    if (items.length === 0) {
      styles.height = `${emptyGroupHeight}px`
    }

    extraProps[`data-layout-${layoutMode}-mode`] = true

    if (isDraggingOver) {
      extraProps['data-dragging-over'] = true
    }

    this.itemsIndexCache = {}

    return connectDropTarget(
      <div
        ref={this.getNode}
        className="DesignGroup"
        style={styles}
        {...extraProps}
      >
        <Grid
          baseWidth={baseWidth}
          numberOfCols={numberOfCols}
          showTopBorder={showTopBorder}
        />
        {items.map((designItem, index) => {
          this.itemsIndexCache[designItem.id] = index

          return (
            <DesignItem
              key={designItem.id}
              id={designItem.id}
              numberOfCols={numberOfCols}
              layoutMode={layoutMode}
              leftSpace={designItem.leftSpace}
              space={designItem.space}
              selection={selection && selection.item === designItem.id ? selection.data[selection.item] : undefined}
              components={designItem.components}
              onComponentClick={onComponentClick}
              onComponentDragStart={this.handleComponentDragStart}
              onComponentRemove={this.handleComponentRemove}
              onResizeStart={this.handleItemResizeStart}
              onResize={this.handleItemResize}
              onResizeEnd={this.handleItemResizeEnd}
              onDragEnter={this.handleItemDragEnter}
              onDragLeave={this.handleItemDragLeave}
              getIndex={this.getIndexOfItem}
            />
          )
        })}
      </div>
    )
  }
}

DesignGroup.propTypes = {
  id: PropTypes.string.isRequired,
  layoutMode: PropTypes.oneOf(['grid', 'fixed']).isRequired,
  baseWidth: PropTypes.number.isRequired,
  numberOfCols: PropTypes.number.isRequired,
  emptyGroupHeight: PropTypes.number.isRequired,
  showTopBorder: PropTypes.bool,
  placeholder: PropTypes.bool,
  selection: PropTypes.object,
  items: PropTypes.array.isRequired,
  onDragOver: PropTypes.func,
  onComponentClick: PropTypes.func,
  onComponentDragStart: PropTypes.func,
  onComponentRemove: PropTypes.func,
  onItemResizeStart: PropTypes.func,
  onItemResize: PropTypes.func,
  onItemResizeEnd: PropTypes.func,
  getIndex: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  isOver: PropTypes.bool.isRequired
}

export default DropTarget([
  ComponentDragTypes.COMPONENT_TYPE,
  ComponentDragTypes.COMPONENT,
], groupTarget, collect)(DesignGroup)
