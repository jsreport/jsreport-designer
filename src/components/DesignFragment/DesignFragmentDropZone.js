import React, { Fragment, Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DropTarget } from 'react-dnd'
import * as configuration from '../../lib/configuration'
import { ComponentDragTypes } from '../../Constants'
import htmlElementPropType from '../../helpers/htmlElementPropType'
import styles from './DesignFragmentDropZone.scss'

const fragmentDropZoneTarget = {
  hover (props, monitor, component) {
    const { design, fragmentId, onDragOver } = props

    if (monitor.isOver({ shallow: true })) {
      console.log('over fragment drop zone (shallow)..')
      // debugger
      onDragOver({
        element: design.canvasRegistry.get(fragmentId).element
      })
    } else {
      console.log('over fragment drop zone (not shallow)..')
    }
  },

  drop (props, monitor) {
    const { design, fragmentId } = props

    if (monitor.didDrop()) {
      return undefined
    }

    debugger

    return {
      element: design.canvasRegistry.get(fragmentId).element
    }
  }
}

function collect (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget()
  }
}

@observer
class DesignFragmentDropZone extends Component {
  componentWillMount () {
    const { root } = this.props

    if (!root.classList.contains(styles.designFragmentDropZoneContainer)) {
      root.classList.add(styles.designFragmentDropZoneContainer)
    }

    if (root.dataset.fragmentDropZone == null) {
      root.dataset.fragmentDropZone = true
    }
  }

  componentDidMount () {
    const { root, connectDropTarget } = this.props

    connectDropTarget(root)
  }

  render () {
    const DesignComponent = configuration.elementClasses.component
    const { root, instanceId, components } = this.props

    if (components == null || components.length === 0) {
      return (
        <span className={styles.designFragmentDropZoneEmpty}>
          <span>Drop here</span>
        </span>
      )
    }

    return (
      <Fragment>
        {components.map((fragComponent) => (
          <DesignComponent
            key={`${instanceId}/${fragComponent.id}`}
            source={fragComponent}
            root={root}
            id={`${instanceId}.${fragComponent.id}`}
            // TODO: maybe change this to a more generic name
            fragmentId={fragComponent.id}
          />
        ))}
      </Fragment>
    )
  }
}

DesignFragmentDropZone.propTypes = {
  design: MobxPropTypes.observableObject.isRequired,
  root: htmlElementPropType(),
  // disabling because we are using the prop not in render but in other places
  // eslint-disable-next-line react/no-unused-prop-types
  fragmentId: PropTypes.string.isRequired,
  instanceId: PropTypes.string.isRequired,
  components: MobxPropTypes.observableArray,
  connectDropTarget: PropTypes.func.isRequired
}

export default inject((injected) => ({
  design: injected.design,
  onDragOver: injected.onDragOver
}))(
  DropTarget([
    ComponentDragTypes.COMPONENT_BAR,
    ComponentDragTypes.COMPONENT
  ], fragmentDropZoneTarget, collect)(DesignFragmentDropZone)
)
