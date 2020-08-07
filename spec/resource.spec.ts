import chai from 'chai'
import Property from '../src/property'
import buildResource from '../src/resource'
import testSchema from './schema.test.json'

describe('Resource', () => {
  const pkProperty = 'id'
  const resourceName = 'Test'
  const parent = 'Hasura'
  const endpoint = 'http://localhost:3000/graphql'
  let resource

  before(async () => {
    resource = await buildResource({
      endpoint,
      pkProperty,
      parent,
      name: resourceName,
      schema: testSchema,
    })
  })

  describe('#databaseName', () => {
    it('returns correct database name', () => {
      chai.expect(resource.databaseName()).to.equal(parent)
    })
  })

  describe('#databaseType', () => {
    it('returns correct database type', () => {
      chai.expect(resource.databaseType()).to.equal('hasura')
    })
  })

  describe('#name', () => {
    it('returns correct name', () => {
      chai.expect(resource.name()).to.equal(resourceName)
    })
  })

  describe('#id', () => {
    it('returns correct name', () => {
      chai.expect(resource.id()).to.equal(resourceName)
    })
  })

  describe('#properties', () => {
    it('returns all properties', () => {
      const length = 4
      chai.expect(resource.properties()).to.have.lengthOf(length)
    })
  })

  describe('#property', () => {
    it('returns given property', () => {
      chai.expect(resource.property('id')).to.be.an.instanceOf(Property)
    })

    it('returns null when property doesn\'t exit', () => {
      // eslint-disable-next-line no-unused-expressions
      chai.expect(resource.property('test')).to.be.null
    })
  })
})
