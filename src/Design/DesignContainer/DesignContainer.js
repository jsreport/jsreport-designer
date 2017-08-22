import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import HighlightedArea from './HighlightedArea'
import DesignGroup from './DesignGroup'
import './DesignContainer.css'

class DesignContainer extends PureComponent {
  constructor (props) {
    super(props)

    this.groupsIndexCache = null

    this.getContainerNode = this.getContainerNode.bind(this)
    this.getIndexOfGroup = this.getIndexOfGroup.bind(this)
    this.getRelativePositionInsideContainer = this.getRelativePositionInsideContainer.bind(this)
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
    const {
      baseWidth,
      numberOfCols,
      emptyGroupHeight,
      dragging,
      groups,
      selection,
      highlightedArea,
      onDragOver,
      onClickComponent,
      onDragStartComponent,
      onRemoveComponent,
      onResizeItemStart,
      onResizeItem,
      onResizeItemEnd
    } = this.props

    const styles = {
      width: baseWidth
    }

    let extraProps = {}

    if (dragging) {
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
        {highlightedArea && (
          <HighlightedArea
            width={highlightedArea.areaBox.width}
            height={highlightedArea.areaBox.height}
            top={this.getRelativePositionInsideContainer(highlightedArea.areaBox.top, 'top')}
            left={this.getRelativePositionInsideContainer(highlightedArea.areaBox.left, 'left')}
            isValid={!highlightedArea.conflict && highlightedArea.filled}
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
              onClickComponent={onClickComponent}
              onDragStartComponent={onDragStartComponent}
              onRemoveComponent={onRemoveComponent}
              onResizeItemStart={onResizeItemStart}
              onResizeItem={onResizeItem}
              onResizeItemEnd={onResizeItemEnd}
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
  onClickComponent: PropTypes.func,
  onDragStartComponent: PropTypes.func,
  onRemoveComponent: PropTypes.func,
  onResizeItemStart: PropTypes.func,
  onResizeItem: PropTypes.func,
  onResizeItemEnd: PropTypes.func
}

export default DesignContainer
