const JsReport = require('jsreport-core')
const Design = require('./designs/design.js')
const Item = require('./designs/item.js')
const Text = require('./designs/text.js')
const TextWithBoundProp = require('./designs/textWithBoundProp.js')
const TextWithBoundPropAsFunction = require('./designs/textWithBoundPropAsFunction.js')
const TextWithComposeBoundProp = require('./designs/textWithComposeBoundProp.js')
const TextWithStyle = require('./designs/textWithStyle.js')
const TextWithConditionalStyle = require('./designs/textWithConditionalStyle.js')

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
    design.groups[0].items.push(Item({
      components: [Text()]
    }))
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' }
    })
    res.content.toString().should.containEql('Sample text')
  })

  it('should render bound value from input data', async () => {
    design.groups[0].items.push(Item({
      components: [TextWithBoundProp()]
    }))
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' },
      data: { foo: 'Hello world' }
    })
    res.content.toString().should.containEql('Hello world')
  })

  it('should render bound value (as function) from input data', async () => {
    design.groups[0].items.push(Item({
      components: [TextWithBoundPropAsFunction()]
    }))
    let res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' },
      data: { price: 1200 }
    })
    res.content.toString().should.containEql('$.1200 (high)')
    res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' },
      data: { price: 800 }
    })
    res.content.toString().should.containEql('$.800 (low)')
  })

  it('should render bound value (composing) from input data', async () => {
    design.groups[0].items.push(Item({
      components: [TextWithComposeBoundProp()]
    }))
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' },
      data: { name: 'jsreport' }
    })
    res.content.toString().should.containEql('My name is jsreport')
  })

  it('should render styles', async () => {
    design.groups[0].items.push(Item({
      components: [TextWithStyle()]
    }))
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' }
    })
    const content = res.content.toString()
    content.should.containEql('Sample text')
    content.should.containEql('style="background-color: rgba(202, 39, 39, 1); font-size: 14px; text-align: center;"')
  })

  it('should render conditional styles (matched condidition)', async () => {
    design.groups[0].items.push(Item({
      components: [TextWithConditionalStyle()]
    }))
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' },
      data: { name: 'jsreport' }
    })
    res.content.toString().should.containEql('style="color: rgba(40, 52, 189, 1);"')
  })

  it('should render conditional styles (default case)', async () => {
    design.groups[0].items.push(Item({
      components: [TextWithConditionalStyle()]
    }))
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' },
      data: { name: 'test' }
    })
    res.content.toString().should.containEql('style="color: rgba(193, 23, 23, 1);"')
  })

  it('should render with multiple components in item', async () => {
    design.groups[0].items.push(Item({
      components: [Text({ text: 'Text1' }), Text({ text: 'Text2' }), Text({ text: 'Text3' })]
    }))
    const res = await jsreport.render({
      template: { design: design, recipe: 'html', engine: 'none' }
    })
    res.content.toString().should.containEql('Text1')
    res.content.toString().should.containEql('Text2')
    res.content.toString().should.containEql('Text3')
  })
})
