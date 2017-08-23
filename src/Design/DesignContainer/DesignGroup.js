import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import { ComponentTypes } from '../../Constants'
import Grid from '../Grid'
import DesignItem from './DesignItem'
import './DesignGroup.css'

const groupTarget = {
  hover (props, monitor, component) {
    let id = props.id
    let getIndex = props.getIndex
    let groupNode = component.node
    let groupDimensions = groupNode.getBoundingClientRect()
    let item = monitor.getItem()
    let clientOffset = monitor.getClientOffset()

    // don't fire the event until the cursor is over the group
    if (
      clientOffset.x < groupDimensions.left ||
      clientOffset.y < groupDimensions.top
    ) {
      return
    }

    if (props.onDragOver) {
      props.onDragOver({
        group: getIndex(id),
        groupDimensions,
        item,
        clientOffset
      })
    }
  },

  drop (props, monitor) {
    let id = props.id
    let getIndex = props.getIndex

    let result = {
      group: getIndex(id),
      clientOffset: monitor.getClientOffset()
    }

    return result
  }
}

function collect (connect) {
  return {
    connectDropTarget: connect.dropTarget()
  }
}

class DesignGroup extends PureComponent {
  constructor (props) {
    super(props)

    this.itemsIndexCache = null

    this.getIndexOfItem = this.getIndexOfItem.bind(this)
    this.getIndex = this.getIndex.bind(this)
    this.getNode = this.getNode.bind(this)
    this.handleItemResizeStart = this.handleItemResizeStart.bind(this)
    this.handleItemResize = this.handleItemResize.bind(this)
    this.handleItemResizeEnd = this.handleItemResizeEnd.bind(this)
    this.handleComponentRemove = this.handleComponentRemove.bind(this)
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

  handleComponentRemove (args) {
    if (this.props.onComponentRemove) {
      this.props.onComponentRemove({
        ...args,
        group: this.getIndex()
      })
    }
  }

  render () {
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
      onComponentDragStart,
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
              minSpace={designItem.minSpace}
              space={designItem.space}
              selection={selection && selection.item === designItem.id ? selection.data[selection.item] : undefined}
              components={designItem.components}
              onComponentClick={onComponentClick}
              onComponentDragStart={onComponentDragStart}
              onComponentRemove={this.handleComponentRemove}
              onResizeStart={this.handleItemResizeStart}
              onResize={this.handleItemResize}
              onResizeEnd={this.handleItemResizeEnd}
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
  connectDropTarget: PropTypes.func.isRequired
}

export default DropTarget(ComponentTypes.COMPONENT_TYPE, groupTarget, collect)(DesignGroup)
