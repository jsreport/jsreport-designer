import React, { Component, PureComponent } from 'react'
import { observer, inject } from 'mobx-react'
import PropTypes from 'prop-types'
import GridCol from './GridCol'
import styles from './Grid.scss'

class GridContent extends PureComponent {
  render () {
    const { colWidth, numberOfCols } = this.props
    let gridCols = []

    for (let colIdx = 0; colIdx < numberOfCols - 1; colIdx++) {
      let left = colWidth * (colIdx + 1)

      gridCols.push(
        <GridCol
          key={colIdx}
          // left - 1 because the col has 1px of border width
          left={left - colIdx}
        />
      )
    }

    return (
      <div className={styles.gridContent}>
        {gridCols}
      </div>
    )
  }
}

@inject((injected) => ({
  design: injected.design
}))
@observer
class Grid extends Component {
  render () {
    const { design, showTopBorder } = this.props
    const { colWidth, numberOfCols } = design

    return (
      <div className={styles.grid} data-design-grid="true">
        {showTopBorder && (
          <div className={styles.gridTop} data-design-grid-border />
        )}
        <GridContent
          colWidth={colWidth}
          numberOfCols={numberOfCols}
        />
      </div>
    )
  }
}

Grid.propTypes = {
  showTopBorder: PropTypes.bool.isRequired
}

export default Grid
