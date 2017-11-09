import React, { Component } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import componentRegistry from '../../../shared/componentRegistry'
import getConsumedColsFromWidth from '../../helpers/getConsumedColsFromWidth'
import * as configuration from '../../lib/configuration'
import { ComponentCollectionPreviewLayer } from '../ComponentPreview'
import ComponentBar from '../ComponentBar'
import { ComponentEditor } from '../Editor'
import CommandBar from '../CommandBar'
import styles from './SideBar.scss'

@inject((injected) => ({
  updateComponent: injected.designsActions.updateComponent
}))
@observer
class SideBar extends Component {
  constructor (props) {
    super(props)

    this.registeredComponents = Object.keys(
      componentRegistry.getComponents()
    ).map((compName) => {
      return {
        name: compName,
        icon: configuration.componentTypes[compName].icon,
        group: configuration.componentTypesDefinition[compName].group,
      }
    })

    this.componentCollectionPreviewNode = document.getElementById('component-collection-preview-root')

    this.handleComponentPreviewNodesChange = this.handleComponentPreviewNodesChange.bind(this)
    this.handleComponentBarItemDragStart = this.handleComponentBarItemDragStart.bind(this)
    this.handleComponentBarItemDragEnd = this.handleComponentBarItemDragEnd.bind(this)
    this.handleChangesInEditor = this.handleChangesInEditor.bind(this)
  }

  handleComponentPreviewNodesChange (previewNodes) {
    // we are using a preview layer where we are rendering one instance per component type,
    // these preview nodes will be used to take the dimensions consumed by a component
    this.componentPreviewNodes = previewNodes
  }

  handleComponentBarItemDragStart (componentType) {
    let colWidth = this.props.design.colWidth

    let item = {
      ...componentType
    }

    let component
    let componentPreviewNode
    let componentDimensions

    if (!this.componentPreviewNodes || !this.componentPreviewNodes[item.name]) {
      return {}
    }

    component = componentRegistry.getComponent(item.name)
    componentPreviewNode = this.componentPreviewNodes[item.name]

    // showing preview node when dragging is starting,
    // this is needed in order to take the dimensions of the component from the DOM
    componentPreviewNode.container.style.display = 'block'

    // taking the consumed space of component from the DOM
    componentDimensions = componentPreviewNode.component.getBoundingClientRect()

    item.size = {
      width: componentDimensions.width,
      height: componentDimensions.height
    }

    item.pointerPreviewPosition = {
      x: componentDimensions.width / 2,
      y: componentDimensions.height / 2
    }

    item.props = typeof component.getDefaultProps === 'function' ? component.getDefaultProps() : {}

    item.rawContent = componentPreviewNode.instance.getRawContent()

    item.consumedCols = getConsumedColsFromWidth({
      baseColWidth: colWidth,
      width: item.size.width
    })

    return item;
  }

  handleComponentBarItemDragEnd (componentType) {
    let componentPreviewNode

    if (!this.componentPreviewNodes || !this.componentPreviewNodes[componentType.name]) {
      return
    }

    // hiding preview node when dragging has ended
    componentPreviewNode = this.componentPreviewNodes[componentType.name]
    componentPreviewNode.container.style.display = 'none'
  }

  handleChangesInEditor (componentId, changes) {
    const { design, updateComponent } = this.props

    updateComponent(design.id, componentId, changes)
  }

  renderComponentEditor (selection) {
    const { design } = this.props
    let componentId = selection[selection.length - 1]
    let component = design.canvasRegistry.get(componentId).element

    return (
      <ComponentEditor
        key={component.id}
        id={component.id}
        type={component.type}
        template={component.template}
        properties={component.props}
        bindings={component.bindings}
        onChange={this.handleChangesInEditor}
      />
    )
  }

  render () {
    const { nodeRef, design } = this.props
    const { selection } = design

    return (
      <div ref={nodeRef} className={styles.sideBar}>
        <div
          className={styles.sideBarContent}
          style={{
            transform: selection ? 'translateX(-100%)' : undefined
          }}
        >
          <ComponentBar
            componentCollection={this.registeredComponents}
            onItemDragStart={this.handleComponentBarItemDragStart}
            onItemDragEnd={this.handleComponentBarItemDragEnd}
          />
          <div className={styles.sideBarOffset} style={{ transform: selection ? 'translateX(0)' : 'translateX(-200%)', opacity: selection ? 1 : 0 }}>
            {selection && this.renderComponentEditor(selection)}
          </div>
        </div>
        <div className={styles.sideBarFooter}>
          <CommandBar />
        </div>
        {createPortal(
          <ComponentCollectionPreviewLayer
            design={design}
            onPreviewNodesChange={this.handleComponentPreviewNodesChange}
          />,
          this.componentCollectionPreviewNode
        )}
      </div>
    )
  }
}

SideBar.propTypes = {
  nodeRef: PropTypes.func,
  design: MobxPropTypes.observableObject.isRequired
}

export default SideBar
