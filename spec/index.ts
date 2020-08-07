/* eslint-disable import/first */
process.env.NODE_ENV = 'test'

import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'

chai.use(sinonChai)

beforeEach(() => {
  sinon.createSandbox()
})

afterEach(() => {
  sinon.restore()
})

require('./property.spec')
require('./resource.spec')
