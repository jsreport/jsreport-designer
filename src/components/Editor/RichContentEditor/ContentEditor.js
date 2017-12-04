import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Editor,
  EditorState,
  RichUtils
} from 'draft-js'
import styles from './ContentEditor.scss'

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote':
      return styles.contentEditorBlockquote
    default:
      return null
  }
}

const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  { label: 'Blockquote', style: 'blockquote', icon: 'quote-left' },
  { label: 'UL', style: 'unordered-list-item', icon: 'list-ul' },
  { label: 'OL', style: 'ordered-list-item', icon: 'list-ol' }
]

const INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD', icon: 'bold' },
  { label: 'Italic', style: 'ITALIC', icon: 'italic' },
  { label: 'Underline', style: 'UNDERLINE', icon: 'underline' },
  { label: 'Strikethrough', style: 'STRIKE', icon: 'strikethrough'  }
]

class ContentEditor extends Component {
  constructor (props) {
    super(props)

    let initialState = {}

    initialState = {
      editorState: EditorState.createWithContent(props.initialContentState)
    }

    this.state = initialState

    this.setEditorRef = this.setEditorRef.bind(this)
    this.focus = this.focus.bind(this)
    this.handleKeyCommand = this.handleKeyCommand.bind(this)
    this.handleTab = this.handleTab.bind(this)
    this.handleEditorChange = this.handleEditorChange.bind(this)
    this.toggleBlockType = this.toggleBlockType.bind(this);
    this.toggleInlineStyle = this.toggleInlineStyle.bind(this);

    if (props.onContentChange) {
      props.onContentChange(initialState.editorState.getCurrentContent())
    }
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

  toggleBlockType (blockType) {
    this.handleEditorChange(
      RichUtils.toggleBlockType(this.state.editorState, blockType)
    );
  }

  toggleInlineStyle (inlineStyle) {
    this.handleEditorChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }

  handleKeyCommand (command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command)

    if (newState) {
      this.handleEditorChange(newState);
      return true
    }

    return false
  }

  handleTab (ev) {
    const maxDepth = 4
    this.handleEditorChange(RichUtils.onTab(ev, this.state.editorState, maxDepth))
  }

  handleEditorChange (editorState) {
    if (this.props.onContentChange) {
      this.props.onContentChange(editorState.getCurrentContent())
    }

    this.setState({ editorState })
  }

  render () {
    const { styleMap } = this.props
    const { editorState } = this.state

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = styles.contentEditorEditor
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
        <BlockStyleControls
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <div className={className} onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.handleEditorChange}
            onTab={this.handleTab}
            placeholder="Add some content..."
            ref={this.setEditorRef}
            spellCheck={true}
          />
        </div>
      </div>
    )
  }
}

class StyleButton extends React.Component {
  constructor() {
    super()

    this.onToggle = this.onToggle.bind(this)
  }

  onToggle (ev) {
    ev.preventDefault();
    this.props.onToggle(this.props.style);
  }

  render() {
    const { label, icon } = this.props
    let className = styles.contentEditorStyleButton

    if (this.props.active) {
      className += ` ${styles.contentEditorActiveButton}`
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {icon ? (
          <span className={`fa fa-${icon}`} title={label}></span>
        ) : (
          label
        )}
      </span>
    );
  }
}

const BlockStyleControls = props => {
  const { editorState } = props
  const selection = editorState.getSelection()

  const blockType = (
    editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType()
  )

  return (
    <div className={styles.contentEditorControls}>
      {BLOCK_TYPES.map(type => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          icon={type.icon}
          style={type.style}
        />
      ))}
    </div>
  )
}

const InlineStyleControls = props => {
  let currentStyle = props.editorState.getCurrentInlineStyle()

  return (
    <div className={styles.contentEditorControls}>
      {INLINE_STYLES.map(type => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          icon={type.icon}
          style={type.style}
        />
      ))}
    </div>
  )
}

ContentEditor.propTypes = {
  styleMap: PropTypes.object,
  initialContentState: PropTypes.any,
  onContentChange: PropTypes.func
}

export default ContentEditor
