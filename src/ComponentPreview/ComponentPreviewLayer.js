import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DesignComponent from '../DesignComponent'
import './ComponentPreviewLayer.css'

const componentRegistry = require('../shared/componentRegistry')

class ComponentPreviewLayer extends PureComponent {
  constructor (props) {
    super(props)

    this.previewNodes = {}

    this.renderComponentPreview = this.renderComponentPreview.bind(this)
    this.getRefPreviewNode = this.getRefPreviewNode.bind(this)
  }

  getRefPreviewNode (componentTypeName, el) {
    if (!el) {
      this.previewNodes[componentTypeName] = el
    } else {
      this.previewNodes[componentTypeName] = {
        container: el.parentNode,
        component: el
      }
    }

    if (this.props.onPreviewNodesChange) {
      this.props.onPreviewNodesChange(this.previewNodes)
    }
  }

  getDefaultPropsForComponent (componentTypeName) {
    const component = componentRegistry.getComponentFromType(componentTypeName)

    if (typeof component.getDefaultProps !== 'function') {
      return {}
    }

    return component.getDefaultProps()
  }

  renderComponentPreview (componentType) {
    const {
      defaultWidth
    } = this.props

    return (
      <div key={componentType.id} style={{ width: `${defaultWidth}px`, display: 'none' }}>
        <DesignComponent
          componentRef={this.getRefPreviewNode}
          type={componentType.name}
          componentProps={this.getDefaultPropsForComponent(componentType.name)}
        />
      </div>
    )
  }

  render () {
    const {
      componentCollection
    } = this.props

    return (
      <div className="ComponentPreviewLayer">
        <div style={{width: '50px', height: '50px', overflow: 'hidden'}}>
          {componentCollection.map(this.renderComponentPreview)}
        </div>
      </div>
    )
  }
}

ComponentPreviewLayer.propTypes = {
  defaultWidth: PropTypes.number.isRequired,
  componentCollection: PropTypes.array.isRequired,
  onPreviewNodesChange: PropTypes.func
}

export default ComponentPreviewLayer
