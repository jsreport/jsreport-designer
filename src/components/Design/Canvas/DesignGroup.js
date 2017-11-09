import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DropTarget } from 'react-dnd'
import { ComponentDragTypes } from '../../../Constants'
import Grid from '../Grid'
import DesignItem from './DesignItem'
import styles from '../../../../static/DesignElements.css'
import interactiveStyles from './DesignElementsInteractive.scss'

const groupTarget = {
  hover (props, monitor, component) {
    const { design, group, updateElement, onDragOver } = props
    let groupNode = component.node
    let groupDimensions = groupNode.getBoundingClientRect()

    if (!monitor.isOver()) {
      component.draggingOverStart = Date.now()
    }

    // show dragging over styles after 200ms of beign over the group
    if (
      (Date.now() - component.draggingOverStart) > 200 &&
      !group.itemsRemarked
    ) {
      updateElement(
        design.id,
        group.id,
        { itemsRemarked: true }
      )
    }

    if (onDragOver) {
      if (monitor.isOver({ shallow: true })) {
        onDragOver({ element: group, groupDimensions })
      } else if (monitor.isOver()) {
        onDragOver({ groupDimensions })
      }
    }
  },

  drop (props, monitor, component) {
    const { group } = props

    if (monitor.didDrop()) {
      return undefined
    }

    return { element: group }
  }
}

function collect (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isDraggingOver: monitor.isOver()
  }
}

@observer
class DesignGroup extends Component {
  constructor (props) {
    super(props)

    this.draggingOverStart = null

    this.getNode = this.getNode.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.isDraggingOver && !nextProps.isDraggingOver) {
      this.draggingOverStart = null

      nextProps.updateElement(
        nextProps.design.id,
        nextProps.group.id,
        { itemsRemarked: false }
      )
    }
  }

  getNode (el) {
    this.node = el
  }

  render () {
    let { showTopBorder, connectDropTarget } = this.props

    const { design, group } = this.props
    const { rowHeight } = design
    const { layoutMode, items, itemsRemarked, placeholder } = group

    let inlineStyles = {}
    let extraProps = {}

    if (placeholder === true) {
      inlineStyles.backgroundColor = 'rgba(87, 191, 216, 0.3)'
    }

    if (items.length === 0) {
      inlineStyles.height = `${rowHeight}px`
    }

    extraProps[`data-layout-${layoutMode}-mode`] = true

    if (itemsRemarked) {
      extraProps['data-items-remarked'] = true
    }

    return connectDropTarget(
      <div
        ref={this.getNode}
        className={`${styles.designGroup} ${interactiveStyles.designGroupInteractive}`}
        style={inlineStyles}
        {...extraProps}
      >
        <Grid
          showTopBorder={showTopBorder}
        />
        {items.map((designItem, index) => (
          <DesignItem
            key={designItem.id}
            item={designItem}
            layoutMode={layoutMode}
          />
        ))}
      </div>
    )
  }
}

DesignGroup.propTypes = {
  group: MobxPropTypes.observableObject.isRequired,
  showTopBorder: PropTypes.bool,
  connectDropTarget: PropTypes.func.isRequired,
  isDraggingOver: PropTypes.bool.isRequired
}

export default inject((injected) => ({
  design: injected.design,
  onDragOver: injected.onDragOver,
  updateElement: injected.designsActions.updateElement
}))(
  DropTarget([
    ComponentDragTypes.COMPONENT_BAR,
    ComponentDragTypes.COMPONENT,
  ], groupTarget, collect)(DesignGroup)
)
