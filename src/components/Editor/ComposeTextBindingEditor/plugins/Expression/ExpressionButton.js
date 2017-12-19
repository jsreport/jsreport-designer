import React, { Component } from 'react'
import PropTypes from 'prop-types'
import entityType from './entityType'
import addOrEditExpressionModifier from './addOrEditExpressionModifier'
import Button from '../../Button'
import ExpressionEdit from './ExpressionEdit'

class ExpressionButton extends Component {
  constructor (props) {
    super(props)

    this.state = {
      showExpressionInput: null
    }

    this.getExpressionEntityInSelection = this.getExpressionEntityInSelection.bind(this)
    this.getExpressionFromEntity = this.getExpressionFromEntity.bind(this)
    this.handleToogle = this.handleToogle.bind(this)
    this.handleSaveExpression = this.handleSaveExpression.bind(this)
    this.handleCloseExpression = this.handleCloseExpression.bind(this)
  }

  getExpressionEntityInSelection (editorState) {
    const contentState = editorState.getCurrentContent()
    const selection = editorState.getSelection()
    const startBlockKey = selection.getStartKey()
    const currentBlock = contentState.getBlockForKey(startBlockKey)

    if (!currentBlock) {
      return undefined
    }

    const currentEntityKey = currentBlock.getEntityAt(selection.getStartOffset())

    if (!currentEntityKey) {
      return undefined
    }

    const currentEntityInstance = contentState.getEntity(currentEntityKey)

    if (currentEntityInstance.getType() !== entityType) {
      return undefined
    }

    return {
      key: currentEntityKey,
      instance: currentEntityInstance
    }
  }

  getExpressionFromEntity (expEntity) {
    const { expressions } = this.props

    if (!expEntity) {
      return undefined
    }

    const { instance: expEntityInstance } = expEntity
    const exprData = expEntityInstance.getData()

    if (expressions == null || exprData == null || exprData.name == null) {
      return undefined
    }

    return {
      name: exprData.name,
      type: expressions[exprData.name].type,
      value: expressions[exprData.name].value
    }
  }

  close () {
    const { store } = this.props

    store.setEditorReadOnly(false)

    this.setState({
      showExpressionInput: null
    })
  }

  handleToogle () {
    if (this.state.showExpressionInput != null) {
      return
    }

    const { store } = this.props
    const buttonPosition = this.node.getBoundingClientRect()

    store.setEditorReadOnly(true)

    this.setState({
      showExpressionInput: {
        top: buttonPosition.top + buttonPosition.height,
        left: buttonPosition.left
      }
    })
  }

  handleSaveExpression ({ prevExpressionName, expression }) {
    const expressionName = expression.name
    const { editorState, store, onExpressionEdit } = this.props
    const getExpressionEntityInSelection = this.getExpressionEntityInSelection
    const selection = editorState.getSelection()
    let currentExprEntity

    if (expressionName == null || expressionName === '') {
      return
    }

    currentExprEntity = getExpressionEntityInSelection(editorState)

    store.setEditorState(addOrEditExpressionModifier(
      currentExprEntity ? currentExprEntity.key : undefined,
      editorState,
      selection,
      expressionName
    ))

    if (onExpressionEdit) {
      onExpressionEdit({ prevExpressionName, expression })
    }

    this.close()
  }

  handleCloseExpression () {
    this.close()
  }

  render () {
    const { getExpressionEntityInSelection, getExpressionFromEntity } = this
    const { showExpressionInput } = this.state
    const { editorState, dataFields, allowedDataExpressionTypes, expressions } = this.props
    const currentExprEntity = getExpressionEntityInSelection(editorState)

    return (
      <div
        ref={(el) => { this.node = el }}
        style={{ display: 'inline-block', position: 'relative' }}
      >
        <Button
          active={showExpressionInput != null || currentExprEntity != null}
          label='Expression'
          onToggle={this.handleToogle}
          icon={'flask'}
        />
        {showExpressionInput != null && (
          <ExpressionEdit
            top={showExpressionInput.top}
            left={showExpressionInput.left}
            initialExpression={getExpressionFromEntity(currentExprEntity)}
            dataFields={dataFields}
            allowedDataExpressionTypes={allowedDataExpressionTypes}
            expressions={expressions}
            onSave={this.handleSaveExpression}
            onClose={this.handleCloseExpression}
          />
        )}
      </div>
    )
  }
}

ExpressionButton.propTypes = {
  store: PropTypes.object.isRequired,
  editorState: PropTypes.any.isRequired,
  dataFields: PropTypes.object,
  allowedDataExpressionTypes: PropTypes.arrayOf(PropTypes.string),
  expressions: PropTypes.object,
  onExpressionEdit: PropTypes.func
}

export default ExpressionButton
