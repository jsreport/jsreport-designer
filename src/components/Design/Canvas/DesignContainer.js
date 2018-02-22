import React, { Component } from 'react'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import HighlightedArea from './HighlightedArea'
import * as configuration from '../../../lib/configuration'
import styles from '../../../../static/DesignElements.css'

@inject((injected) => ({
  design: injected.design
}))
@observer
class DesignContainer extends Component {
  render () {
    const DesignGroup = configuration.elementClasses.group
    const { design } = this.props
    const { baseWidth, groups } = design

    return (
      <div
        className={styles.designContainer}
        style={{ width: baseWidth }}
      >
        <HighlightedArea />
        {groups.map((group, index) => (
          <DesignGroup
            key={group.id}
            group={group}
            showTopBorder={index !== 0}
          />
        ))}
      </div>
    )
  }
}

DesignContainer.wrappedComponent.propTypes = {
  design: MobxPropTypes.observableObject.isRequired
}

export default DesignContainer
