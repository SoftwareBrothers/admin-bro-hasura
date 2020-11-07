import { BaseProperty, PropertyType } from 'admin-bro'
import { GraphQLTypeNode, HasuraPropertyProps } from './types'

const TYPES_MAPPING = {
  Int: 'number',
  Float: 'float',
  String: 'string',
  ID: 'id',
  Boolean: 'boolean',
  json: 'string',
  jsonb: 'string',
  bigint: 'number',
  timestamp: 'date',
  timestamptz: 'datetime',
}

const buildProperty = (props: HasuraPropertyProps): BaseProperty => {
  const { graphqlFieldDefinitionNode, pkProperty, referencedResource = null } = props

  class Property extends BaseProperty {
    constructor() {
      super({ path: graphqlFieldDefinitionNode.name })
    }

    getType(node: GraphQLTypeNode): string | null {
      if (node.name) return node.name

      if (!node.ofType) return null

      return this.getType(node.ofType)
    }

    name(): string {
      return graphqlFieldDefinitionNode.name
    }

    isEditable(): boolean {
      return !this.isId()
        && !this.isArray()
    }

    isVisible(): boolean {
      return this.name() !== '__typename'
    }

    isId(): boolean {
      return ['id', pkProperty].includes(this.name().toLowerCase())
    }

    reference(): string | null {
      if (referencedResource) {
        return referencedResource
      }

      return null
    }

    isArray(): boolean {
      return graphqlFieldDefinitionNode.type.kind === 'LIST'
        || (
          graphqlFieldDefinitionNode.type.kind === 'NON_NULL'
          && !!graphqlFieldDefinitionNode.type.ofType
          && graphqlFieldDefinitionNode.type.ofType.kind === 'LIST')
    }

    type(): PropertyType {
      if (this.reference()) {
        return 'reference'
      }

      const namedTypeNode = this.getType(graphqlFieldDefinitionNode.type)

      if (!namedTypeNode) return 'string'

      return TYPES_MAPPING[namedTypeNode] || 'string'
    }

    isSortable(): boolean {
      return ['string', 'number'].includes(this.type())
    }

    isRequired(): boolean {
      return graphqlFieldDefinitionNode.type.kind === 'NON_NULL'
    }

    availableValues(): null {
      return null
    }

    subProperties(): any[] {
      return []
    }
  }

  return new Property()
}

export default buildProperty
