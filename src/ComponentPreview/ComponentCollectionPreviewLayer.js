import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Component as DesignComponent } from '../DesignComponent'
import './ComponentCollectionPreviewLayer.css'

const componentRegistry = require('../shared/componentRegistry')

class ComponentCollectionPreviewLayer extends PureComponent {
  constructor (props) {
    super(props)

    this.previewNodes = {}

    this.renderComponentPreview = this.renderComponentPreview.bind(this)
    this.getRefPreviewNode = this.getRefPreviewNode.bind(this)
    this.getDataInput = this.getDataInput.bind(this)
  }

  getDataInput () {
    return this.props.dataInput
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
      colWidth
    } = this.props

    return (
      <div key={componentType.id} style={{ width: `${colWidth}px`, display: 'none' }}>
        <DesignComponent
          componentRef={this.getRefPreviewNode}
          type={componentType.name}
          componentProps={this.getDefaultPropsForComponent(componentType.name)}
          getDataInput={this.getDataInput}
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
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  componentCollection: PropTypes.array.isRequired,
  onPreviewNodesChange: PropTypes.func
}

export default ComponentCollectionPreviewLayer
