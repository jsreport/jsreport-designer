import React, { Component } from 'react'
import { createPortal } from 'react-dom'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import * as configuration from '../../lib/configuration'

class DesignFragment extends Component {
  constructor (props) {
    super(props)

    this.mountNode = null
  }

  componentWillMount () {
    const { fragment } = this.props
    this.mountNode = document.createElement(fragment.tag)
  }

  render () {
    const DesignComponent = configuration.elementClasses.component
    const { fragment, onClick } = this.props
    const mountNode = this.mountNode

    return createPortal(
      <DesignComponent
        source={fragment}
        root={mountNode}
        onClick={onClick}
        dragDisabled
      />,
      mountNode
    )
  }
}

DesignFragment.propTypes = {
  fragment: MobxPropTypes.observableObject.isRequired,
  onClick: PropTypes.func
}

export default DesignFragment
