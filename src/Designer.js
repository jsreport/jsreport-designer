import React, { Component } from 'react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import SplitPane from './SplitPane'
import ComponentBar from './ComponentBar'
import Preview from './Preview'
import './Designer.css'

class Designer extends Component {
  render() {
    return (
      <div className="Designer container">
        <div className="block">
          <SplitPane
            defaultSize='88%'
            primary="second"
            collapsable="first"
            collapsedText="Components"
            split="vertical"
            resizerClassName="resizer"
          >
            <ComponentBar />
            <Preview />
          </SplitPane>
        </div>
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(Designer)
