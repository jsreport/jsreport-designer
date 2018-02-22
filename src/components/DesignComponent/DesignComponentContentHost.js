import React, { Component } from 'react'
import PropTypes from 'prop-types'
import RawHTML from '../RawHTML'
import htmlElementPropType from '../../helpers/htmlElementPropType'
import styles from '../../../static/DesignElements.css'
import interactiveStyles from './DesignComponentInteractive.scss'

class DesignComponentHost extends Component {
  constructor (props) {
    super(props)

    this.getClassName = this.getClassName.bind(this)
  }

  componentWillMount () {
    const { root, id, componentId, type, selected, snapshoot, isDragging } = this.props
    const rootIsDOM = typeof root !== 'string'

    if (!rootIsDOM) {
      return
    }

    // when root is a dom node the we need to add the attributes
    // directly to the node
    root.id = id
    root.className = this.getClassName()

    root.dataset.jsreportInteractiveComponent = true
    root.dataset.jsreportComponent = true
    root.dataset.jsreportComponentId = componentId != null ? componentId : id
    root.dataset.jsreportComponentType = type

    if (selected) {
      root.dataset.selected = true
    }

    if (snapshoot) {
      root.dataset.snapshoot = true
    }

    if (isDragging) {
      root.dataset.dragging = true
    }
  }

  componentWillReceiveProps (nextProps) {
    const root = nextProps.root
    const rootIsDOM = typeof root !== 'string'

    if (!root || !rootIsDOM) {
      return
    }

    root.className = this.getClassName()

    if (this.props.componentId !== nextProps.componentId) {
      if (nextProps.componentId == null) {
        root.dataset.jsreportComponentId = nextProps.id
      } else {
        root.dataset.jsreportComponentId = nextProps.componentId
      }
    }

    // when root is a dom node the we need to handle the attributes
    // updates directly to the node

    if (this.props.selected !== true && nextProps.selected === true) {
      root.dataset.selected = true
    } else if (this.props.selected === true && nextProps.selected !== true) {
      delete root.dataset.selected
    }

    if (this.props.snapshoot !== true && nextProps.snapshoot === true) {
      root.dataset.snapshoot = true
    } else if (this.props.snapshoot === true && nextProps.snapshoot !== true) {
      delete root.dataset.snapshoot
    }

    if (this.props.isDragging !== true && nextProps.isDragging === true) {
      root.dataset.dragging = true
    } else if (this.props.isDragging === true && nextProps.isDragging !== true) {
      delete root.dataset.dragging
    }
  }

  getClassName () {
    const { block } = this.props
    let className = `${styles.designComponent} ${interactiveStyles.designComponentInteractive}`

    if (block === true) {
      className += ` ${styles.designComponentBlock}`
    }

    return className
  }

  render () {
    const {
      nodeRef,
      id,
      componentId,
      type,
      root,
      content,
      selected,
      snapshoot,
      isDragging
    } = this.props

    let el

    if (typeof root === 'string') {
      const dataProps = {}

      dataProps['data-jsreport-interactive-component'] = true
      dataProps['data-jsreport-component'] = true
      dataProps['data-jsreport-component-id'] = componentId != null ? componentId : id
      dataProps['data-jsreport-component-type'] = type

      if (selected) {
        dataProps['data-selected'] = true
      }

      if (snapshoot) {
        dataProps['data-snapshoot'] = true
      }

      if (isDragging) {
        dataProps['data-dragging'] = true
      }

      el = React.createElement(
        root,
        {
          ref: nodeRef,
          id,
          className: this.getClassName(),
          dangerouslySetInnerHTML: { __html: content },
          ...dataProps
        }
      )
    } else {
      el = (
        <RawHTML
          ref={() => nodeRef(root)}
          targetNode={root}
          html={content}
        />
      )
    }

    return el
  }
}

DesignComponentHost.propTypes = {
  nodeRef: PropTypes.func,
  id: PropTypes.string.isRequired,
  componentId: PropTypes.string,
  type: PropTypes.string.isRequired,
  root: PropTypes.oneOfType([
    PropTypes.string,
    htmlElementPropType()
  ]).isRequired,
  content: PropTypes.string,
  block: PropTypes.bool,
  selected: PropTypes.bool,
  snapshoot: PropTypes.bool,
  isDragging: PropTypes.bool
}

export default DesignComponentHost
