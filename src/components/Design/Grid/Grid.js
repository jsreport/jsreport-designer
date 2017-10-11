import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import arrayFrom from 'array.from'
import GridCol from './GridCol'
import './Grid.css'

class GridContent extends PureComponent {
  render () {
    const {
      baseWidth,
      numberOfCols
    } = this.props

    const colWidth = baseWidth / numberOfCols

    return (
      <div className="Grid-content">
        {arrayFrom({ length: numberOfCols - 1 }, (v, i) => i).map((val, colidx) => {
          let left = colWidth * (val + 1)

          return (
            <GridCol
              key={val}
              // left - 1 because the col has 1px of border width
              left={left - colidx}
            />
          )
        })}
      </div>
    )
  }
}

class Grid extends PureComponent {
  render () {
    const {
      baseWidth,
      numberOfCols,
      showTopBorder
    } = this.props

    return (
      <div className="Grid" data-design-grid="true">
        {showTopBorder && (
          <div className="Grid-top" data-design-grid-border />
        )}
        <GridContent
          baseWidth={baseWidth}
          numberOfCols={numberOfCols}
        />
      </div>
    )
  }
}

Grid.propTypes = {
  baseWidth: PropTypes.number.isRequired,
  numberOfCols: PropTypes.number.isRequired,
  showTopBorder: PropTypes.bool.isRequired
}

export default Grid
