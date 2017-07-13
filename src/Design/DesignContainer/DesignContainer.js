import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DesignGroup from './DesignGroup'
import './DesignContainer.css'

class DesignContainer extends PureComponent {
  render () {
    const {
      baseWidth,
      numberOfCols,
      designGroups
    } = this.props

    const styles = {
      width: baseWidth
    }

    return (
      <div
        className="DesignContainer"
        style={styles}
      >
        {designGroups.map((designGroup) => (
          <DesignGroup
            key={'DesignGroup-' + designGroup.id}
            numberOfCols={numberOfCols}
            topSpace={designGroup.topSpace}
            layoutMode={designGroup.layoutMode}
            items={designGroup.items}
          />
        ))}
      </div>
    )
  }
}

DesignContainer.propTypes = {
  baseWidth: PropTypes.number.isRequired,
  numberOfCols: PropTypes.number.isRequired,
  designGroups: PropTypes.array.isRequired
}

export default DesignContainer
