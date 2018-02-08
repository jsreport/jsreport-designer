import React, { Component } from 'react'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import componentRegistry from '../../../shared/componentRegistry'
import { Component as DesignComponent } from '../DesignComponent'
import styles from './ComponentCollectionPreviewLayer.scss'

@observer
class ComponentCollectionPreviewLayer extends Component {
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

  renderComponentPreview (componentType) {
    const {
      colWidth
    } = this.props.design

    return (
      <div key={componentType} style={{ width: `${colWidth}px`, display: 'none' }}>
        <DesignComponent
          id={`collectionPreview${componentType}`}
          componentRef={this.getRefPreviewNode}
          type={componentType}
          componentProps={componentRegistry.getDefaultProps(componentType)}
          preview
          dragDisabled
        />
      </div>
    )
  }

  render () {
    return (
      <div className={styles.componentCollectionPreviewLayer}>
        <div className={styles.componentCollectionPreviewLayerList}>
          {Object.keys(componentRegistry.getComponents()).map(this.renderComponentPreview)}
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
