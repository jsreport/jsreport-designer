import React, { Fragment, Component } from 'react'
import { createPortal } from 'react-dom'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import DesignFragmentDropZone from './DesignFragmentDropZone'
import * as configuration from '../../lib/configuration'

@observer
class DesignFragment extends Component {
  constructor (props) {
    super(props)

    this.mountNodes = null
  }

  componentWillMount () {
    const { fragment } = this.props

    this.mountNodes = fragment.instances.reduce((acu, instance, instanceIndex) => {
      const node = document.createElement(instance.tag)

      if (instance.style != null) {
        node.style = instance.style
      }

      acu[`${fragment.type}.${instanceIndex}`] = node
      return acu
    }, {})
  }

  render () {
    // TODO: refactor rest of components (Group, Item) to use components
    // from configuration
    const DesignComponent = configuration.elementClasses.component
    const { fragment } = this.props
    const mountNodes = this.mountNodes

    let content = (
      fragment.instances.map((instance, instanceIndex) => {
        const mountNode = mountNodes[`${fragment.type}.${instanceIndex}`]

        if (fragment.mode === 'inline') {
          return (
            createPortal(
              <DesignComponent
                key={`${fragment.mode}/${instance.id}`}
                source={fragment}
                root={mountNode}
                id={instance.id}
                fragmentId={fragment.id}
                template={instance.template}
                dragDisabled
              />,
              mountNode
            )
          )
        } else if (fragment.mode === 'component') {
          return (
            createPortal(
              <DesignFragmentDropZone
                key={`${fragment.mode}/${instance.id}`}
                fragmentId={fragment.id}
                instanceId={instance.id}
                root={mountNode}
                components={fragment.components}
              />,
              mountNode
            )
          )
        }

        return null
      })
    )

    return (
      <Fragment>
        {content}
      </Fragment>
    )
  }
}

DesignFragment.propTypes = {
  fragment: MobxPropTypes.observableObject.isRequired
}

export default DesignFragment
