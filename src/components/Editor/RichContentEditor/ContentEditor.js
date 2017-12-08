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
      editorState: null
    }

    this.state = initialState

    this.setEditorRef = this.setEditorRef.bind(this)
    this.focus = this.focus.bind(this)
    this.getContentRepresentation = this.getContentRepresentation.bind(this)
    this.handleKeyCommand = this.handleKeyCommand.bind(this)
    this.handleEditorChange = this.handleEditorChange.bind(this)

    if (props.onContentChange) {
      props.onContentChange(initialState.editorState.getCurrentContent())
    }
  }

  componentWillMount () {
    const initialContent = this.props.initialContent != null ? this.props.initialContent : ''
    let contentState

    if (typeof initialContent === 'string') {
      contentState = ContentState.createFromText(initialContent)
    } else {
      contentState = stateFromHTML(initialContent.html, {
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
      editorState: EditorState.createWithContent(contentState)
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
    const { editorState } = this.state

    return stateToHTML(editorState.getCurrentContent(), {
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
    })
  }

  handleKeyCommand (command, editorState) {
    // this handles just basic rich commands, exactly the ones that we use
    // for inline, block styles
    const newState = RichUtils.handleKeyCommand(editorState, command)

    if (newState) {
      this.handleEditorChange(newState);
      return true
    }

    return false
  }

  handleEditorChange (editorState) {
    if (this.props.onContentChange) {
      this.props.onContentChange(editorState.getCurrentContent())
    }

    this.setState({ editorState })
  }

  render () {
    const { editorState } = this.state

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
          <ExpressionButton editorState={editorState} />
        </div>
        <div className={className} onClick={this.focus}>
          <Editor
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.handleEditorChange}
            placeholder="Add some content..."
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
  onContentChange: PropTypes.func
}

export default ContentEditor
