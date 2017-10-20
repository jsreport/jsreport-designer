import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import PropTypes from 'prop-types'

const Box = ({ width, height, top, left, color }) => {
  let position = `translate(${left}px, ${top}px)`

  return (
    <div style={{
      display: 'inline-block',
      position: 'absolute',
      backgroundColor: color,
      WebkitTransform: position,
      MsTransform: position,
      transform: position,
      width,
      height,
      zIndex: 1
    }}
    >
      {' '}
    </div>
  )
}

class HighlightedArea extends Component {
  getRelativePositionInsideContainer (containerDimensions, areaPosition, topOrLeft) {
    let position

    if (topOrLeft === 'top') {
      position = areaPosition - containerDimensions.top
    } else {
      position = areaPosition - containerDimensions.left
    }

    return position
  }

  render () {
    const {
      highlightedArea,
      getContainerDimensions
    } = this.props

    if (!highlightedArea) {
      return null
    }

    const containerDimensions = getContainerDimensions()

    return [
      highlightedArea.contextBox ? (
        <Box
          key="contentBox"
          width={highlightedArea.contextBox.width}
          height={highlightedArea.contextBox.height}
          top={this.getRelativePositionInsideContainer(containerDimensions, highlightedArea.contextBox.top, 'top')}
          left={this.getRelativePositionInsideContainer(containerDimensions, highlightedArea.contextBox.left, 'left')}
          color={'rgba(0, 147, 255, 0.1)'}
        />
      ): null,
      highlightedArea.areaBox ? (
        <Box
          key="areaBox"
          width={highlightedArea.areaBox.width}
          height={highlightedArea.areaBox.height}
          top={this.getRelativePositionInsideContainer(containerDimensions, highlightedArea.areaBox.top, 'top')}
          left={this.getRelativePositionInsideContainer(containerDimensions, highlightedArea.areaBox.left, 'left')}
          color={(!highlightedArea.conflict && highlightedArea.filled) ? 'rgba(194, 236, 203, 0.6)' : 'rgba(226, 145, 145, 0.6)'}
        />
      ) : null
    ]
  }
}

HighlightedArea.propTypes = {
  highlightedArea: PropTypes.object,
  getContainerDimensions: PropTypes.func
}

@inject((injected) => ({
  highlightedArea: injected.design.highlightedArea,
  getContainerDimensions: injected.getCanvasDimensions
}))
@observer
class ObservableHighlightedArea extends Component {
  render () {
    return (
      <HighlightedArea {...this.props} />
    )
  }
}

export default ObservableHighlightedArea
