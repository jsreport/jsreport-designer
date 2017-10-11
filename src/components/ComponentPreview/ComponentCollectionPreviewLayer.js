import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Component as DesignComponent } from '../DesignComponent'
import './ComponentCollectionPreviewLayer.css'

const componentRegistry = require('../../shared/componentRegistry')

class ComponentCollectionPreviewLayer extends PureComponent {
  constructor (props) {
    super(props)

    this.previewNodes = {}

    this.renderComponentPreview = this.renderComponentPreview.bind(this)
    this.getRefPreviewNode = this.getRefPreviewNode.bind(this)
  }

  getRefPreviewNode (componentTypeName, el, instance) {
    if (!el) {
      this.previewNodes[componentTypeName] = el
    } else {
      this.previewNodes[componentTypeName] = {
        container: el.parentNode,
        component: el,
        instance: instance
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
      colWidth
    } = this.props

    return (
      <div key={componentType.id} style={{ width: `${colWidth}px`, display: 'none' }}>
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
      <div className="ComponentCollectionPreviewLayer">
        <div className="ComponentCollectionPreviewLayer-list">
          {componentCollection.map(this.renderComponentPreview)}
        </div>
      </div>
    )
  }
}

ComponentCollectionPreviewLayer.propTypes = {
  colWidth: PropTypes.number.isRequired,
  componentCollection: PropTypes.array.isRequired,
  onPreviewNodesChange: PropTypes.func
}

export default ComponentCollectionPreviewLayer
