import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import HighlightedArea from './HighlightedArea'
import DesignGroup from './DesignGroup'
import styles from '../../../../static/DesignElements.css'

@inject((injected) => ({
  design: injected.design
}))
@observer
class DesignContainer extends Component {
  render () {
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

export default DesignContainer
