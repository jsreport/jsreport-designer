import React, { Fragment, Component } from 'react'
import { createPortal } from 'react-dom'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import * as configuration from '../../lib/configuration'

@observer
class DesignFragment extends Component {
  constructor (props) {
    super(props)

    this.mountNodes = null
  }

  }

  componentWillMount () {
    const { fragment } = this.props

    this.mountNodes = fragment.instances.reduce((acu, instance, instanceIndex) => {
      acu[`${fragment.type}.${instanceIndex}`] = document.createElement(instance.tag)
      return acu
    }, {})
  }

  render () {
    // TODO: refactor rest of components (Group, Item) to use components
    // from configuration
    const DesignComponent = configuration.elementClasses.component
    const { fragment } = this.props
    const mountNodes = this.mountNodes

    return (
      <Fragment>
        {fragment.instances.map((instance, instanceIndex) => {
          const mountNode = mountNodes[`${fragment.type}.${instanceIndex}`]

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
        })}
      </Fragment>
    )
  }
}

DesignFragment.propTypes = {
  fragment: MobxPropTypes.observableObject.isRequired
}

export default DesignFragment
