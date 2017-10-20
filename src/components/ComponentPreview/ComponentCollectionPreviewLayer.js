import React, { Component } from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import componentRegistry from '@local/shared/componentRegistry'
import { Component as DesignComponent } from '../DesignComponent'
import './ComponentCollectionPreviewLayer.css'

@observer
class ComponentCollectionPreviewLayer extends Component {
  constructor (props) {
    super(props)

    this.previewNodes = {}

    this.registeredComponents = Object.keys(componentRegistry.getComponents())

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
    const component = componentRegistry.getComponent(componentTypeName)

    if (typeof component.getDefaultProps !== 'function') {
      return {}
    }

    return component.getDefaultProps()
  }

  renderComponentPreview (componentType) {
    const {
      colWidth
    } = this.props.design

    return (
      <div key={componentType} style={{ width: `${colWidth}px`, display: 'none' }}>
        <DesignComponent
          componentRef={this.getRefPreviewNode}
          type={componentType}
          componentProps={this.getDefaultPropsForComponent(componentType)}
        />
      </div>
    )
  }

  render () {
    return (
      <div className="ComponentCollectionPreviewLayer">
        <div className="ComponentCollectionPreviewLayer-list">
          {this.registeredComponents.map(this.renderComponentPreview)}
        </div>
      </div>
    )
  }
}

ComponentCollectionPreviewLayer.propTypes = {
  design: MobxPropTypes.observableObject.isRequired,
  onPreviewNodesChange: PropTypes.func
}

export default ComponentCollectionPreviewLayer
