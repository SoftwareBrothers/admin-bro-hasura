import chai from 'chai'
import Property from '../src/property'

describe('Property', () => {
  const nonListField = {
    name: 'name',
    description: null,
    args: [],
    type: { kind: 'SCALAR', name: 'String', ofType: null },
    isDeprecated: false,
    deprecationReason: null,
  }

  const listField = {
    name: 'colors',
    description: null,
    args: [],
    type: {
      kind: 'LIST',
      name: null,
      ofType: { kind: 'SCALAR', name: 'String', ofType: null },
    },
    isDeprecated: false,
    deprecationReason: null,
  }

  const stringField = nonListField

  const bigintField = {
    name: 'age',
    description: null,
    args: [],
    type: { kind: 'SCALAR', name: 'bigint', ofType: null },
    isDeprecated: false,
    deprecationReason: null,
  }

  const requiredField = {
    name: 'id',
    description: null,
    args: [],
    type: {
      kind: 'NON_NULL',
      name: null,
      ofType: { kind: 'SCALAR', name: 'bigint', ofType: null },
    },
    isDeprecated: false,
    deprecationReason: null,
  }

  const notRequiredField = stringField

  const pkProperty = 'id'

  describe('#isArray', () => {
    it('returns false for regular (not arrayed) property', () => {
      const property = new Property(nonListField, pkProperty)

      chai.expect(property.isArray()).to.equal(false)
    })

    it('returns true for array property', () => {
      const property = new Property(listField, pkProperty)
      chai.expect(property.isArray()).to.equal(true)
    })
  })

  describe('#type', () => {
    it('returns correct string type', () => {
      const property = new Property(stringField, pkProperty)
      chai.expect(property.type()).to.equal('string')
    })

    it('returns correct integer type', () => {
      const property = new Property(bigintField, pkProperty)
      chai.expect(property.type()).to.equal('number')
    })
  })

  describe('isRequired', () => {
    it('returns true for required fields', () => {
      const property = new Property(requiredField, pkProperty)
      chai.expect(property.isRequired()).to.equal(true)
    })

    it('returns false for not required fields', () => {
      const property = new Property(notRequiredField, pkProperty)
      chai.expect(property.isRequired()).to.equal(false)
    })
  })
})
