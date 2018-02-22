import React, { Fragment, Component } from 'react'
import { createPortal } from 'react-dom'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import DesignFragmentComponent from './DesignFragmentComponent'
import * as configuration from '../../lib/configuration'

@observer
class DesignFragment extends Component {
  constructor (props) {
    super(props)

    this.mountNodes = null

    this.getInstancesMountNodes = this.getInstancesMountNodes.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    const { fragment } = nextProps

    this.mountNodes = this.getInstancesMountNodes(this.mountNodes, fragment)
  }

  componentWillMount () {
    const { fragment } = this.props

    this.mountNodes = this.getInstancesMountNodes(this.mountNodes, fragment)
  }

  getInstancesMountNodes (prevNodes, fragment) {
    return fragment.instances.reduce((acu, instance, instanceIndex) => {
      const prevNode = prevNodes != null ? prevNodes[`${fragment.type}.${instanceIndex}`] : undefined
      let node

      if (prevNode != null && prevNode.tagName.toLowerCase() === instance.tag) {
        node = prevNode
      } else {
        node = document.createElement(instance.tag)
      }

      if (instance.style != null) {
        node.style = instance.style
      }

      acu[`${fragment.type}.${instanceIndex}`] = node
      return acu
    }, {})
  }

  render () {
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
                key={`${fragment.mode}/${instance.id}/${instance.tag}`}
                source={fragment}
                root={mountNode}
                id={instance.id}
                componentTargetId={fragment.id}
                template={instance.template}
                dragDisabled
              />,
              mountNode
            )
          )
        } else if (fragment.mode === 'component') {
          return (
            createPortal(
              <DesignFragmentComponent
                key={`${fragment.mode}/${instance.id}/${instance.tag}`}
                fragment={fragment}
                instanceId={instance.id}
                root={mountNode}
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
