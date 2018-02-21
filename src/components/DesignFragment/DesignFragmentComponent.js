import React, { Fragment, Component } from 'react'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DropTarget } from 'react-dnd'
import * as configuration from '../../lib/configuration'
import { ComponentDragTypes } from '../../Constants'
import htmlElementPropType from '../../helpers/htmlElementPropType'
import styles from '../../../static/DesignElements.css'
import interactiveStyles from '../Design/Canvas/DesignElementsInteractive.scss'

const fragmentComponentTarget = {
  hover (props, monitor, component) {
    const { design, root, fragmentId, instanceId, onDragOver } = props

    if (!monitor.isOver()) {
      return
    }

    if (monitor.isOver({ shallow: true })) {
      onDragOver({
        element: design.canvasRegistry.get(fragmentId).element,
        instance: instanceId,
        instanceNode: root
      })
    }
  },

  drop (props, monitor) {
    const { design, fragmentId } = props

    if (monitor.didDrop()) {
      return undefined
    }

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
class DesignFragmentComponent extends Component {
  constructor (props) {
    super(props)

    this.handleComponentDragStart = this.handleComponentDragStart.bind(this)
  }

  componentWillMount () {
    const { root, fragmentId, instanceId, dropHighlight } = this.props

    root.id = instanceId
    root.dataset.jsreportFragmentId = fragmentId

    if (!root.classList.contains(styles.designFragmentComponent)) {
      root.classList.add(styles.designFragmentComponent)
    }

    if (!root.classList.contains(interactiveStyles.designFragmentComponentInteractive)) {
      root.classList.add(interactiveStyles.designFragmentComponentInteractive)
    }

    if (dropHighlight === true && root.dataset.dropHighlight == null) {
      root.dataset.dropHighlight = true
    }
  }

  componentWillReceiveProps (nextProps) {
    const root = nextProps.root
    const currentProps = this.props

    if (currentProps.dropHighlight !== true && nextProps.dropHighlight === true) {
      root.dataset.dropHighlight = true
    } else if (currentProps.dropHighlight === true && nextProps.dropHighlight !== true) {
      delete root.dataset.dropHighlight
    }
  }

  componentDidMount () {
    const { root, connectDropTarget } = this.props

    connectDropTarget(root)
  }

  handleComponentDragStart (component, componentRef) {
    // TODO: replicate here logic from design item but with customization about fragments
    throw new Error('dragging a component from a fragment is not implemented yet')
  }

  render () {
    const DesignComponent = configuration.elementClasses.component
    const { instanceId, components } = this.props
    const hasNoComponents = components == null || components.length === 0

    return (
      <Fragment>
        {hasNoComponents ? (
          <span className={interactiveStyles.designFragmentComponentEmptyInteractive}>
            <span>Drop here</span>
          </span>
        ) : components.map((fragComponent) => (
          <DesignComponent
            key={`${instanceId}/${fragComponent.id}`}
            source={fragComponent}
            id={`${instanceId}.${fragComponent.id}`}
            componentTargetId={fragComponent.id}
            onDragStart={this.handleComponentDragStart}
          />
        ))}
      </Fragment>
    )
  }
}

DesignFragmentComponent.propTypes = {
  // disabling because we are using the prop not in render but in other places
  // eslint-disable-next-line react/no-unused-prop-types
  design: MobxPropTypes.observableObject.isRequired,
  // disabling because we are using the prop not in render but in other places
  // eslint-disable-next-line react/no-unused-prop-types
  fragmentId: PropTypes.string.isRequired,
  instanceId: PropTypes.string.isRequired,
  root: htmlElementPropType(),
  dropHighlight: PropTypes.bool,
  components: MobxPropTypes.observableArray,
  connectDropTarget: PropTypes.func.isRequired
}

export default inject((injected, props) => {
  const { fragment, ...restProps } = props

  return {
    design: injected.design,
    fragmentId: fragment.id,
    dropHighlight: fragment.dropHighlight,
    components: fragment.components,
    ...restProps,
    onDragOver: injected.onDragOver
  }
})(
  DropTarget([
    ComponentDragTypes.COMPONENT_BAR,
    ComponentDragTypes.COMPONENT
  ], fragmentComponentTarget, collect)(DesignFragmentComponent)
)
