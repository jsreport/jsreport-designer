import { Component } from 'react'
import PropTypes from 'prop-types'
import htmlElementPropType from '../../helpers/htmlElementPropType'

// in the future this hack probably can be replaced with something like
// a first class React feature to insert html without wrappers
// https://github.com/facebook/react/pull/7361
// https://github.com/facebook/react/issues/12014#issuecomment-357673890
class RawHTML extends Component {
  componentWillMount () {
    const { targetNode, html } = this.props
    // fragment that will contain all the nodes that will be
    // inserted into targetNode
    const docFrag = document.createDocumentFragment()
    // creating a dummy wrapper just to host the nodes of the raw html
    const wrapper = document.createElement('div')

    // populate with the desired html
    wrapper.innerHTML = html

    docFrag.appendChild(wrapper)

    // move all the nodes inserted in the wrapper to the
    // document fragment root level
    while (wrapper.hasChildNodes()) {
      docFrag.appendChild(wrapper.firstChild)
    }

    // remove wrapper because is not needed anymore
    docFrag.removeChild(wrapper)

    // and finally insert the document fragment into the target node
    targetNode.appendChild(docFrag)
  }

  render () {
    // always return the same to avoid problems with react reconciliation
    return null
  }
}

RawHTML.propTypes = {
  // should be a valid html node element
  targetNode: htmlElementPropType(),
  html: PropTypes.string.isRequired
}

export default RawHTML
