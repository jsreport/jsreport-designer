const JsReport = require('jsreport-core')
const Design = require('./designs/design.js')
const Text = require('./designs/text.js')
const TextWithBoundProp = require('./designs/textWithBoundProp.js')

require('should')

describe('designer', () => {
  let jsreport
  let design

  beforeEach(() => {
    design = Design()
    jsreport = JsReport()
    jsreport.use(require('jsreport-handlebars')())
    jsreport.use(require('../')())
    jsreport.use(require('../built-in-components')())
    return jsreport.init()
  })

  it('should not break the normal rendering', async () => {
    const res = await jsreport.render({
      template: { content: 'foo', engine: 'none', recipe: 'html' }
    })
    res.content.toString().should.be.eql('foo')
  })

  it('should render empty grid', async () => {
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' }
    })
    res.content.toString().should.containEql('<html')
  })

  it('should render text component', async () => {
    design.groups[0].items.push(Text())
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' }
    })
    res.content.toString().should.containEql('Sample text')
  })

  it('text component should render bound value from input data', async () => {
    design.groups[0].items.push(TextWithBoundProp())
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' },
      data: { foo: 'Hello world' }
    })
    res.content.toString().should.containEql('Hello world')
  })
})
