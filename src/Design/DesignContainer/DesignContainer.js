import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import HighlightedArea from './HighlightedArea'
import DesignGroup from './DesignGroup'
import './DesignContainer.css'

class DesignContainer extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      isDragging: false
    }

    this.groupsIndexCache = null

    this.getContainerNode = this.getContainerNode.bind(this)
    this.getIndexOfGroup = this.getIndexOfGroup.bind(this)
    this.getRelativePositionInsideContainer = this.getRelativePositionInsideContainer.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.dragging === false && nextProps.dragging === true) {
      clearTimeout(this.draggingTimeout)

      // show the grid lines a little bit later
      this.draggingTimeout = setTimeout(() => {
        this.setState({ isDragging: true })
      }, 100)
    } else if (this.props.dragging === true && nextProps.dragging === false) {
      clearTimeout(this.draggingTimeout)

      this.setState({ isDragging: false })
    }
  }

  getContainerNode (el) {
    this.containerNode = el
  }

  getIndexOfGroup (groupId) {
    return this.groupsIndexCache[groupId]
  }

  getRelativePositionInsideContainer (areaPosition, topOrLeft) {
    let containerPosition = this.containerNode.getBoundingClientRect()
    let position

    containerPosition = {
      top: containerPosition.top,
      left: containerPosition.left
    }

    if (topOrLeft === 'top') {
      position = areaPosition - containerPosition.top
    } else {
      position = areaPosition - containerPosition.left
    }

    return position
  }

  render () {
    const { isDragging } = this.state

    const {
      baseWidth,
      numberOfCols,
      emptyGroupHeight,
      groups,
      selection,
      highlightedArea,
      onDragOver,
      onComponentClick,
      onComponentDragStart,
      onComponentRemove,
      onItemResizeStart,
      onItemResize,
      onItemResizeEnd
    } = this.props

    const styles = {
      width: baseWidth
    }

    let extraProps = {}

    if (isDragging) {
      extraProps['data-dragging'] = true
    }

    this.groupsIndexCache = {}

    return (
      <div
        ref={this.getContainerNode}
        className="DesignContainer"
        style={styles}
        {...extraProps}
      >
        {highlightedArea && highlightedArea.contextBox && (
          <HighlightedArea
            width={highlightedArea.contextBox.width}
            height={highlightedArea.contextBox.height}
            top={this.getRelativePositionInsideContainer(highlightedArea.contextBox.top, 'top')}
            left={this.getRelativePositionInsideContainer(highlightedArea.contextBox.left, 'left')}
            color={'rgba(0, 147, 255, 0.1)'}
          />
        )}
        {highlightedArea && (
          <HighlightedArea
            width={highlightedArea.areaBox.width}
            height={highlightedArea.areaBox.height}
            top={this.getRelativePositionInsideContainer(highlightedArea.areaBox.top, 'top')}
            left={this.getRelativePositionInsideContainer(highlightedArea.areaBox.left, 'left')}
            color={(!highlightedArea.conflict && highlightedArea.filled) ? 'rgba(194, 236, 203, 0.6)' : 'rgba(226, 145, 145, 0.6)'}
          />
        )}
        {groups.map((designGroup, index) => {
          this.groupsIndexCache[designGroup.id] = index

          return (
            <DesignGroup
              key={designGroup.id}
              id={designGroup.id}
              baseWidth={baseWidth}
              numberOfCols={numberOfCols}
              emptyGroupHeight={emptyGroupHeight}
              showTopBorder={index !== 0}
              placeholder={designGroup.placeholder}
              layoutMode={designGroup.layoutMode}
              selection={selection && selection.group === designGroup.id ? selection.data[selection.group] : undefined}
              items={designGroup.items}
              onDragOver={onDragOver}
              onComponentClick={onComponentClick}
              onComponentDragStart={onComponentDragStart}
              onComponentRemove={onComponentRemove}
              onItemResizeStart={onItemResizeStart}
              onItemResize={onItemResize}
              onItemResizeEnd={onItemResizeEnd}
              getIndex={this.getIndexOfGroup}
            />
          )
        })}
      </div>
    )
  }
}

DesignContainer.propTypes = {
  baseWidth: PropTypes.number.isRequired,
  numberOfCols: PropTypes.number.isRequired,
  emptyGroupHeight: PropTypes.number.isRequired,
  dragging: PropTypes.bool,
  selection: PropTypes.object,
  highlightedArea: PropTypes.object,
  groups: PropTypes.array.isRequired,
  onDragOver: PropTypes.func,
  onComponentClick: PropTypes.func,
  onComponentDragStart: PropTypes.func,
  onComponentRemove: PropTypes.func,
  onItemResizeStart: PropTypes.func,
  onItemResize: PropTypes.func,
  onItemResizeEnd: PropTypes.func
}

export default DesignContainer
