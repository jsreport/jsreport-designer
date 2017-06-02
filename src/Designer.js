import React, { Component } from 'react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import SplitPane from './SplitPane'
import ComponentBar from './ComponentBar'
import Preview from './Preview'
import { ComponentDragLayer } from './ComponentDragPreview'
import './Designer.css'

class Designer extends Component {
  render() {
    return (
      <div className="Designer container">
        <div className="block">
          <SplitPane
            defaultSize='175px'
            minSize={150}
            primary="first"
            collapsable="first"
            collapsedText="Components"
            split="vertical"
            resizerClassName="resizer"
          >
            <ComponentBar />
            <Preview />
          </SplitPane>
          <ComponentDragLayer />
        </div>
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(Designer)
