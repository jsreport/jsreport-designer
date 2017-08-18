import React, { Component } from 'react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import SplitPane from './SplitPane'
import ComponentBar from './ComponentBar'
import Design from './Design'
import { ComponentDragLayer, ComponentPreviewLayer } from './ComponentPreview'
import './Designer.css'

const componentRegistry = require('./shared/componentRegistry')

class Designer extends Component {
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
      componentCollection: componentRegistry.getComponentsDefinition()
    }

    this.componentPreviewNodes = null

    this.onComponentPreviewNodesChange = this.onComponentPreviewNodesChange.bind(this)
    this.onComponentBarItemDragStart = this.onComponentBarItemDragStart.bind(this)
    this.onComponentBarItemDragEnd = this.onComponentBarItemDragEnd.bind(this)
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

    item.props = typeof component.getDefaultProps === 'function' ? component.getDefaultProps() : {}

    item.consumedCols = Math.ceil(
      item.size.width < baseColWidth ? 1 : item.size.width / baseColWidth
    )

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
      componentCollection
    } = this.state

    const currentColWidth = baseWidth / defaultNumberOfCols

    return (
      <div className="Designer container">
        <div className="block">
          <SplitPane
            defaultSize={'175px'}
            minSize={150}
            primary="first"
            collapsable="first"
            collapsedText="Components"
            split="vertical"
            resizerClassName="resizer"
          >
            <ComponentBar
              componentCollection={componentCollection}
              onItemDragStart={this.onComponentBarItemDragStart}
              onItemDragEnd={this.onComponentBarItemDragEnd}
            />
            <Design
              baseWidth={baseWidth}
              defaultRowHeight={defaultRowHeight}
              defaultNumberOfRows={defaultNumberOfRows}
              defaultNumberOfCols={defaultNumberOfCols}
            />
          </SplitPane>
          <ComponentDragLayer defaultWidth={currentColWidth} />
          <ComponentPreviewLayer
            defaultWidth={currentColWidth}
            componentCollection={componentCollection}
            onPreviewNodesChange={this.onComponentPreviewNodesChange}
          />
        </div>
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(Designer)
