
function mountFragments (fragmentsCollection, rootNode) {
  const fragmentsSlotsIterator = document.createNodeIterator(
    rootNode,
    NodeFilter.SHOW_COMMENT,
    (node) => {
      const value = node.nodeValue.trim()

      return value.indexOf('jsreport-designer-fragment') === 0 ? (
        NodeFilter.FILTER_ACCEPT
      ) : NodeFilter.FILTER_REJECT
    }
  )

  let currentSlotNode = fragmentsSlotsIterator.nextNode()

  while (currentSlotNode != null) {
    const value = currentSlotNode.nodeValue.trim()
    const attrs = value.split('#').slice(1)

    if (attrs.length > 0) {
      const nameInfo = attrs[0].split('=')
      const nameValue = nameInfo[1]
      const fragmentInstance = fragmentsCollection[nameValue]

      if (fragmentInstance != null) {
        currentSlotNode.parentNode.replaceChild(fragmentInstance.mountNode, currentSlotNode)
      }
    }

    currentSlotNode = fragmentsSlotsIterator.nextNode()
  }
}

export { mountFragments }
