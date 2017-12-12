import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import SplitPane from './SplitPane'
import SideBar from './SideBar'
import EditingArea from './EditingArea'
import { ComponentDragLayer } from './ComponentPreview'
import styles from './App.scss'

@inject((injected) => ({
  currentDesign: injected.editorStore.currentDesign,
  updateDesign: injected.designsActions.update,
  clearSelectionInDesign: injected.designsActions.clearSelection
}))
@observer
class App extends Component {
  constructor (props) {
    super(props)

    this.componentPreviewNodes = null

    this.setSideBarNode = this.setSideBarNode.bind(this)
    this.setCanvasNode = this.setCanvasNode.bind(this)
    this.handleGlobalClickOrDragStart = this.handleGlobalClickOrDragStart.bind(this)
  }

  componentDidMount () {
    document.addEventListener('click', this.handleGlobalClickOrDragStart, true)
    window.addEventListener('dragstart', this.handleGlobalClickOrDragStart, true)
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleGeneralClickOrDragStart, true)
    window.removeEventListener('dragstart', this.handleGeneralClickOrDragStart, true)
  }

  setSideBarNode (el) {
    this.sideBarNode = findDOMNode(el)
  }

  setCanvasNode (el) {
    this.canvasNode = el
  }

  handleGlobalClickOrDragStart (ev) {
    let { currentDesign, updateDesign, clearSelectionInDesign } = this.props
    let canvasNode = this.canvasNode
    let clickOutsideCanvas

    if (currentDesign.isResizing) {
      updateDesign(currentDesign.id, { isResizing: false })

      if (ev.type === 'click') {
        // sometimes after resizing a click event is produced (after releasing the mouse),
        // so we stop this event, this allow us to mantain the component selection after the
        // resizing has ended, no matter where it ended
        ev.preventDefault()
        ev.stopPropagation()
        return
      }
    }

    clickOutsideCanvas = !canvasNode.contains(ev.target)

    if (this.sideBarNode.contains(ev.target) && currentDesign.selection != null) {
      clickOutsideCanvas = false
    }

    if (clickOutsideCanvas && currentDesign.selection) {
      clearSelectionInDesign(currentDesign.id)
    }
  }

  render () {
    const { currentDesign } = this.props

    return (
      <div className={`${styles.app} container`}>
        <div className='block'>
          <SplitPane
            defaultSize={'175px'}
            minSize={150}
            primary='first'
            collapsable='first'
            collapsedText='Sidebar'
            split='vertical'
            resizerClassName='resizer'
          >
            <SideBar
              nodeRef={this.setSideBarNode}
              design={currentDesign}
            />
            <EditingArea
              canvasRef={this.setCanvasNode}
              design={currentDesign}
            />
          </SplitPane>
          <ComponentDragLayer
            design={currentDesign}
          />
        </div>
      </div>
    )
  }
}

App.wrappedComponent.propTypes = {
  currentDesign: MobxPropTypes.observableObject.isRequired,
  updateDesign: PropTypes.func.isRequired,
  clearSelectionInDesign: PropTypes.func.isRequired
}

export default DragDropContext(HTML5Backend)(App)
