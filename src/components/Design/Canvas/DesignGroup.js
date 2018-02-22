import React, { Component } from 'react'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DropTarget } from 'react-dnd'
import { ComponentDragTypes } from '../../../Constants'
import Grid from '../Grid'
import * as configuration from '../../../lib/configuration'
import styles from '../../../../static/DesignElements.css'
import interactiveStyles from './DesignElementsInteractive.scss'

const groupTarget = {
  hover (props, monitor) {
    const { group, onDragOver } = props

    if (!monitor.isOver()) {
      return
    }

    if (onDragOver && monitor.isOver({ shallow: true })) {
      onDragOver({
        element: group
      })
    }
  },

  drop (props, monitor) {
    const { group } = props

    if (monitor.didDrop()) {
      return undefined
    }

    return { element: group }
  }
}

function collect (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget()
  }
}

@observer
class DesignGroup extends Component {
  render () {
    const DesignItem = configuration.elementClasses.item
    let { showTopBorder, connectDropTarget } = this.props

    const { design, group } = this.props
    const { rowHeight } = design
    const { layoutMode, items, dropHighlight, placeholder } = group

    let inlineStyles = {}
    let extraProps = {}

    if (placeholder === true) {
      inlineStyles.backgroundColor = 'rgba(87, 191, 216, 0.3)'
    }

    if (items.length === 0) {
      inlineStyles.height = `${rowHeight}px`
    }

    extraProps[`data-layout-${layoutMode}-mode`] = true

    if (dropHighlight) {
      extraProps['data-drop-highlight'] = true
    }

    return connectDropTarget(
      <div
        id={group.id}
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
  design: MobxPropTypes.observableObject.isRequired,
  group: MobxPropTypes.observableObject.isRequired,
  showTopBorder: PropTypes.bool,
  connectDropTarget: PropTypes.func.isRequired
}

export default inject((injected) => ({
  design: injected.design,
  onDragOver: injected.onDragOver
}))(
  DropTarget([
    ComponentDragTypes.COMPONENT_BAR,
    ComponentDragTypes.COMPONENT
  ], groupTarget, collect)(DesignGroup)
)
