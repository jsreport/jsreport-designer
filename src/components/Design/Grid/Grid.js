import React, { Component, PureComponent } from 'react'
import { observer, inject } from 'mobx-react'
import PropTypes from 'prop-types'
import arrayFrom from 'array.from'
import GridCol from './GridCol'
import './Grid.css'

class GridContent extends PureComponent {
  render () {
    const { colWidth, numberOfCols } = this.props

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

@inject((injected) => ({
  design: injected.design
}))
@observer
class Grid extends Component {
  render () {
    const { design, showTopBorder } = this.props
    const { colWidth, numberOfCols } = design

    return (
      <div className="Grid" data-design-grid="true">
        {showTopBorder && (
          <div className="Grid-top" data-design-grid-border />
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
