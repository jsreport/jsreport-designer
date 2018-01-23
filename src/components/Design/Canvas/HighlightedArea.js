import React, { Component } from 'react'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
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

Box.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  top: PropTypes.number,
  left: PropTypes.number,
  color: PropTypes.string
}

const Mark = ({ isBlock, size, top, left }) => {
  const cornerSize = 4
  const defaultMarkerSize = 2
  const position = `translate(${left}px, ${top}px)`
  const width = isBlock ? size : defaultMarkerSize
  const height = isBlock ? defaultMarkerSize : size
  const cornerColor = `rgba(98, 196, 98, 0.9)`
  const color = `rgba(98, 196, 98, 0.7)`

  return (
    <div style={{
      display: 'block',
      position: 'absolute',
      WebkitTransform: position,
      MsTransform: position,
      transform: position,
      borderColor: isBlock ? `transparent ${cornerColor}` : `${cornerColor} transparent`,
      borderWidth: `${cornerSize}px ${cornerSize}px`,
      borderStyle: 'solid',
      outline: 'none',
      transition: 'transform .2s ease 0s, width .1s ease 0s, height .1s ease 0s',
      width: `${width}px`,
      height: `${height}px`,
      marginLeft: `${isBlock ? 0 : cornerSize * -1}px`,
      marginTop: `${isBlock ? cornerSize * -1 : 0}px`,
      pointerEvents: 'none',
      zIndex: 2
    }}
    >
      <div
        style={{
          backgroundColor: color,
          boxShadow: '0 0 3px rgba(0,0,0,0.2)',
          transition: 'width .1s ease 0s, height .1s ease 0s',
          width: isBlock ? `${width - cornerSize}px` : `${width}px`,
          height: isBlock ? `${height}px` : `${height - cornerSize}px`,
          margin: `${defaultMarkerSize * -1 / 2}px 0px 0px ${defaultMarkerSize * -1 / 2}px`,
          pointerEvents: 'none',
          outline: 'none'
        }}
      />
    </div>
  )
}

Mark.propTypes = {
  isBlock: PropTypes.bool,
  size: PropTypes.number,
  top: PropTypes.number,
  left: PropTypes.number
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
          key='contentBox'
          width={highlightedArea.contextBox.width}
          height={highlightedArea.contextBox.height}
          top={this.getRelativePositionInsideContainer(containerDimensions, highlightedArea.contextBox.top, 'top')}
          left={this.getRelativePositionInsideContainer(containerDimensions, highlightedArea.contextBox.left, 'left')}
          color={'rgba(0, 147, 255, 0.1)'}
        />
      ) : null,
      highlightedArea.mark ? (
        <Mark
          key='mark'
          isBlock={highlightedArea.mark.isBlock}
          size={highlightedArea.mark.size}
          top={this.getRelativePositionInsideContainer(containerDimensions, highlightedArea.mark.top, 'top')}
          left={this.getRelativePositionInsideContainer(containerDimensions, highlightedArea.mark.left, 'left')}
        />
      ) : null,
      highlightedArea.areaBox ? (
        <Box
          key='areaBox'
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
