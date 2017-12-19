import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  EditorState,
  ContentState,
  RichUtils
} from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import { stateFromHTML } from 'draft-js-import-html'
import { stateToHTML } from 'draft-js-export-html'
import createBlockStylesPlugin from './plugins/BlockStyles'
import createInlineStylesPlugin from './plugins/InlineStyles'
import createExpressionPlugin from './plugins/Expression'
import Separator from './Separator'
import styles from './ContentEditor.scss'

const blockStylesPlugin = createBlockStylesPlugin()
const inlineStylesPlugin = createInlineStylesPlugin()
const expressionPlugin = createExpressionPlugin()
const plugins = [blockStylesPlugin, inlineStylesPlugin, expressionPlugin]
const BlockStylesButtons = blockStylesPlugin.BlockStylesButtons
const InlineStylesButtons = inlineStylesPlugin.InlineStylesButtons
const ExpressionButton = expressionPlugin.ExpressionButton

class ContentEditor extends Component {
  constructor (props) {
    super(props)

    let initialState = {
      editorState: null,
      editingExpressions: null
    }

    this.state = initialState

    this.setEditorRef = this.setEditorRef.bind(this)
    this.focus = this.focus.bind(this)
    this.getContentRepresentation = this.getContentRepresentation.bind(this)
    this.handleKeyCommand = this.handleKeyCommand.bind(this)
    this.handleExpressionEdit = this.handleExpressionEdit.bind(this)
    this.handleEditorChange = this.handleEditorChange.bind(this)
  }

  componentWillMount () {
    const initialContent = this.props.initialContent != null ? this.props.initialContent : ''
    const initialExpressions = this.props.expressions
    let contentState

    if (typeof initialContent === 'string') {
      contentState = ContentState.createFromText(initialContent)
    } else {
      contentState = stateFromHTML(initialContent.content, {
        customInlineFn: (element, { Style, Entity }) => {
          const inlineResolvers = [
            inlineStylesPlugin.convertStyleFrom,
            expressionPlugin.convertEntityFrom
          ]

          let result

          inlineResolvers.some((resolver) => {
            result = resolver(element, { Style, Entity })
            return result != null
          })

          return result
        }
      })
    }

    this.setState({
      editorState: EditorState.createWithContent(contentState),
      editingExpressions: initialExpressions
    })
  }

  setEditorRef (el) {
    this.editor = el
  }

  focus () {
    if (!this.editor) {
      return
    }

    this.editor.focus()
  }

  getContentRepresentation () {
    const { editorState, editingExpressions } = this.state

    return {
      content: stateToHTML(editorState.getCurrentContent(), {
        defaultBlockTag: 'div',
        inlineStyles: inlineStylesPlugin.convertStyleTo(),
        entityStyleFn: (entity) => {
          const entityResolvers = [
            expressionPlugin.convertEntityTo
          ]

          let result

          entityResolvers.some((resolver) => {
            result = resolver(entity)
            return result != null
          })

          return result
        }
      }),
      expressions: editingExpressions
    }
  }

  handleKeyCommand (command, editorState) {
    // this handles just basic rich commands, exactly the ones that we use
    // for inline, block styles
    const newState = RichUtils.handleKeyCommand(editorState, command)

    if (newState) {
      this.handleEditorChange(newState)
      return true
    }

    return false
  }

  handleEditorChange (editorState) {
    if (
      this.props.onContentChange &&
      this.state.editorState.getCurrentContent() !== editorState.getCurrentContent()
    ) {
      this.props.onContentChange(editorState.getCurrentContent())
    }

    this.setState({ editorState })
  }

  handleExpressionEdit ({ prevExpressionName, expression: expressionEdited }) {
    const { editingExpressions } = this.state

    let expressionsToSave = editingExpressions == null ? {} : editingExpressions

    if (!expressionEdited) {
      return
    }

    expressionsToSave = {
      ...expressionsToSave
    }

    if (prevExpressionName != null) {
      delete expressionsToSave[prevExpressionName]
    }

    expressionsToSave[expressionEdited.name] = {
      type: expressionEdited.type,
      value: expressionEdited.value
    }

    this.setState({
      editingExpressions: expressionsToSave
    }, () => {
      this.focus()
    })
  }

  render () {
    const { dataFields, allowedDataExpressionTypes } = this.props
    const { editorState, editingExpressions } = this.state

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = styles.contentEditorInput
    var contentState = editorState.getCurrentContent()

    if (!contentState.hasText()) {
      if (
        contentState
          .getBlockMap()
          .first()
          .getType() !== 'unstyled'
      ) {
        className += ` ${styles.contentEditorHidePlaceholder}`
      }
    }

    return (
      <div className={styles.contentEditorRoot}>
        <div className={styles.contentEditorButtonsContainer}>
          <BlockStylesButtons editorState={editorState} />
        </div>
        <div className={styles.contentEditorButtonsContainer}>
          <InlineStylesButtons editorState={editorState} />
          <Separator />
          <ExpressionButton
            editorState={editorState}
            dataFields={dataFields}
            allowedDataExpressionTypes={allowedDataExpressionTypes}
            expressions={editingExpressions}
            onExpressionEdit={this.handleExpressionEdit}
          />
        </div>
        <div className={className} onClick={this.focus}>
          <Editor
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.handleEditorChange}
            placeholder='Add some content...'
            plugins={plugins}
            ref={this.setEditorRef}
          />
        </div>
      </div>
    )
  }
}

ContentEditor.propTypes = {
  initialContent: PropTypes.any,
  dataFields: PropTypes.object,
  allowedDataExpressionTypes: PropTypes.arrayOf(PropTypes.string),
  expressions: PropTypes.object,
  onContentChange: PropTypes.func
}

export default ContentEditor
