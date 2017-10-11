import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { getConsumedColsFromWidth } from '../src/helpers/canvas'
import SplitPane from './components/SplitPane'
import SideBar from './components/SideBar'
import Design from './components/Design'
import { ComponentDragLayer, ComponentCollectionPreviewLayer } from './components/ComponentPreview'
import './App.css'

const componentRegistry = require('./shared/componentRegistry')

class App extends Component {
  constructor (props) {
    super(props)

    /*
      base width and base height depends on the target paper format
      A4 -> 980px width, with a factor of 1.414 aprox for height
    */
    // values as constants for now
    this.state = {
      baseWidth: 980,
      defaultNumberOfRows: 7,
      defaultNumberOfCols: 12,
      defaultRowHeight: 78,
      componentCollection: componentRegistry.getComponentsDefinition(),
      componentEdition: null,
      dataInput: null
    }

    this.componentPreviewNodes = null

    this.setSideBarNode = this.setSideBarNode.bind(this)
    this.handleGlobalClick = this.handleGlobalClick.bind(this)
    this.handleDesignSelectionChange = this.handleDesignSelectionChange.bind(this)
    this.handleCommandSave = this.handleCommandSave.bind(this)
    this.handleComponentEditionChange = this.handleComponentEditionChange.bind(this)
    this.onComponentPreviewNodesChange = this.onComponentPreviewNodesChange.bind(this)
    this.onComponentBarItemDragStart = this.onComponentBarItemDragStart.bind(this)
    this.onComponentBarItemDragEnd = this.onComponentBarItemDragEnd.bind(this)
  }

  setSideBarNode (el) {
    this.sideBar = findDOMNode(el)
  }

  handleGlobalClick (clickOutsideCanvas, target) {
    if (this.sideBar.contains(target) && this.state.componentEdition != null) {
      // prevents de-selecting when a click is emitted on sidebar
      return false
    }

    return clickOutsideCanvas
  }

  handleDesignSelectionChange ({ designGroups, designSelection, onComponentChange }) {
    let currentComponent
    let groupIndex
    let itemIndex
    let componentIndex

    if (!designSelection) {
      return this.setState({
        componentEdition: null
      })
    }

    groupIndex = designSelection.index

    currentComponent = designGroups[groupIndex]

    itemIndex = designSelection.data[designSelection.group].index

    currentComponent = currentComponent.items[itemIndex]

    componentIndex = designSelection.data[designSelection.group].data[
      designSelection.data[designSelection.group].item
    ].index

    currentComponent = currentComponent.components[componentIndex]

    this.setState({
      componentEdition: {
        id: currentComponent.id,
        type: currentComponent.type,
        template: currentComponent.template,
        props: currentComponent.props,
        bindings: currentComponent.bindings,
        canvas: {
          group: groupIndex,
          item: itemIndex,
          component: componentIndex
        },
        onComponentChange
      }
    })
  }

  handleCommandSave (dataInput) {
    this.setState({
      dataInput
    })
  }

  handleComponentEditionChange (componentChanges) {
    const componentEdition = this.state.componentEdition
    let newComponentEdition = { ...componentEdition, ...componentChanges }

    this.setState({
      componentEdition: newComponentEdition
    })

    componentEdition.onComponentChange(
      newComponentEdition.canvas,
      componentChanges
    )
  }

  onComponentPreviewNodesChange (previewNodes) {
    // we are using a preview layer where we are rendering one instance per component type,
    // these preview nodes will be used to take the dimensions consumed by a component
    this.componentPreviewNodes = previewNodes
  }

  onComponentBarItemDragStart (componentType) {
    let baseColWidth = this.state.baseWidth / this.state.defaultNumberOfCols

    let item = {
      ...componentType
    }

    let component
    let componentPreviewNode
    let componentDimensions

    if (!this.componentPreviewNodes || !this.componentPreviewNodes[item.name]) {
      return {}
    }

    component = componentRegistry.getComponentFromType(item.name)
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
      baseColWidth,
      width: item.size.width
    })

    return item;
  }

  onComponentBarItemDragEnd (componentType) {
    let componentPreviewNode

    if (!this.componentPreviewNodes || !this.componentPreviewNodes[componentType.name]) {
      return
    }

    // hiding preview node when dragging has ended
    componentPreviewNode = this.componentPreviewNodes[componentType.name]
    componentPreviewNode.container.style.display = 'none'
  }

  render() {
    const {
      baseWidth,
      defaultRowHeight,
      defaultNumberOfRows,
      defaultNumberOfCols,
      componentCollection,
      componentEdition,
      dataInput
    } = this.state

    const currentColWidth = baseWidth / defaultNumberOfCols

    return (
      <div className="App container">
        <div className="block">
          <SplitPane
            defaultSize={'175px'}
            minSize={150}
            primary="first"
            collapsable="first"
            collapsedText="Sidebar"
            split="vertical"
            resizerClassName="resizer"
          >
            <SideBar
              ref={this.setSideBarNode}
              componentEdition={componentEdition}
              componentCollection={componentCollection}
              dataInput={dataInput}
              onComponentEditionChange={this.handleComponentEditionChange}
              onCommandSave={this.handleCommandSave}
              onItemDragStart={this.onComponentBarItemDragStart}
              onItemDragEnd={this.onComponentBarItemDragEnd}
            />
            <Design
              baseWidth={baseWidth}
              defaultRowHeight={defaultRowHeight}
              defaultNumberOfRows={defaultNumberOfRows}
              defaultNumberOfCols={defaultNumberOfCols}
              dataInput={dataInput}
              onGlobalClick={this.handleGlobalClick}
              onDesignSelectionChange={this.handleDesignSelectionChange}
            />
          </SplitPane>
          <ComponentDragLayer dataInput={dataInput} colWidth={currentColWidth} />
          <ComponentCollectionPreviewLayer
            colWidth={currentColWidth}
            componentCollection={componentCollection}
            onPreviewNodesChange={this.onComponentPreviewNodesChange}
          />
        </div>
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(App)
