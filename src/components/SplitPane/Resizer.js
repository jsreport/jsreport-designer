import React, { Component } from 'react'
import './Resizer.css'

class Resizer extends Component {
  constructor(props) {
    super(props)

    this.onMouseDown = this.onMouseDown.bind(this)
  }

  onMouseDown (event) {
    if (!this.props.collapsed) {
      this.props.onMouseDown(event)
    }
  }

  render () {
    const {
      split,
      className,
      collapsed,
      collapse,
      collapsedText,
      collapsable,
      undocked,
      undockeable
    } = this.props
    const classes = ['Resizer', split, className]

    return (
      <div className={classes.join(' ') + (collapsed ? ' collapsed' : '')} onMouseDown={this.onMouseDown}>
        <div className='resizer-line'></div>
        {collapsed ? (
          <div className='pane-holder' onClick={(e) => collapse(false, undockeable, undocked ? false : null)}>
            {undockeable && undocked && (
              <span>
                <i className={'fa fa-window-maximize'}></i>
                {' '}
              </span>
            )}
            {collapsedText}
          </div>
        ) : (
          <div
            title='Minimize pane'
            className={'docker ' + (collapsable === 'first' ? 'left' : '')}
            onClick={(e) => collapse(true, undockeable, null)}
          >
            <i className={'fa ' + (collapsable === 'first' ? 'fa-long-arrow-left' : 'fa-long-arrow-right')}></i>
          </div>
        )}
        {!collapsed && undockeable && (
          <div
            title='Undock preview pane into extra browser tab'
            className={'docker ' + (collapsable === 'first' ? 'left' : '')}
            style={{ top: '35px' }}
            onClick={(e) => collapse(true, undockeable, true)}
          >
            <i className={'fa fa-window-restore'}></i>
          </div>
        )}
      </div>)
  }
}

export default Resizer
