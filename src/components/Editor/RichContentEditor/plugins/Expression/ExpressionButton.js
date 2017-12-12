import React, { Component } from 'react'
import PropTypes from 'prop-types'
import addExpressionModifier from './addExpressionModifier'
import Button from '../../Button'

class ExpressionButton extends Component {
  constructor (props) {
    super(props)

    this.state = {
      showExpressionInput: false
    }

    this.handleToogle = this.handleToogle.bind(this)
    this.handleNewExpression = this.handleNewExpression.bind(this)
  }

  handleToogle () {
    this.setState({
      showExpressionInput: true
    })
  }

  handleNewExpression () {
    const expressionName = this.expressionNameNode.value
    const { editorState, store } = this.props
    const selection = editorState.getSelection()

    if (expressionName == null || expressionName === '') {
      return
    }

    if (!selection.isCollapsed()) {
      return
    }

    store.setEditorState(addExpressionModifier(editorState, selection, expressionName))

    this.setState({
      showExpressionInput: false
    })
  }

  render () {
    const { showExpressionInput } = this.state

    return (
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <Button
          active={showExpressionInput || false}
          label='Expression'
          onToggle={this.handleToogle}
          icon={'flask'}
        />
        {showExpressionInput && (
          <div
            style={{
              position: 'absolute',
              left: '0px',
              width: '230px',
              backgroundColor: '#b0c8d8',
              border: '1px solid #ccc',
              padding: '4px',
              zIndex: 1000
            }}
          >
            <input
              ref={(el) => { this.expressionNameNode = el }}
              autoFocus
              placeholder='Expression name'
            />
            {' '}
            <button onClick={this.handleNewExpression}>Ok</button>
            <button onClick={() => this.setState({ showExpressionInput: false })}>Cancel</button>
          </div>
        )}
      </div>
    )
  }
}

ExpressionButton.propTypes = {
  store: PropTypes.object.isRequired,
  editorState: PropTypes.any.isRequired
}

export default ExpressionButton
