import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DesignGroup from './DesignGroup'
import './DesignContainer.css'

class DesignContainer extends PureComponent {
  render () {
    const {
      baseWidth,
      numberOfCols,
      groups,
      selection,
      onClickComponent,
      onRemoveComponent,
      onResizeItemStart,
      onResizeItem,
      onResizeItemEnd
    } = this.props

    const styles = {
      width: baseWidth
    }

    return (
      <div
        className="DesignContainer"
        style={styles}
      >
        {groups.map((designGroup) => (
          <DesignGroup
            key={designGroup.id}
            numberOfCols={numberOfCols}
            topSpace={designGroup.topSpace}
            layoutMode={designGroup.layoutMode}
            selection={selection && selection.group === designGroup.id ? selection.data[selection.group] : undefined}
            items={designGroup.items}
            onClickComponent={onClickComponent}
            onRemoveComponent={onRemoveComponent}
            onResizeItemStart={onResizeItemStart}
            onResizeItem={onResizeItem}
            onResizeItemEnd={onResizeItemEnd}
          />
        ))}
      </div>
    )
  }
}

DesignContainer.propTypes = {
  baseWidth: PropTypes.number.isRequired,
  numberOfCols: PropTypes.number.isRequired,
  selection: PropTypes.object,
  groups: PropTypes.array.isRequired,
  onClickComponent: PropTypes.func,
  onRemoveComponent: PropTypes.func,
  onResizeItemStart: PropTypes.func,
  onResizeItem: PropTypes.func,
  onResizeItemEnd: PropTypes.func
}

export default DesignContainer
