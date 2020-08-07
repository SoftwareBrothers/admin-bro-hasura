import { BaseProperty, PropertyType } from 'admin-bro'
import { GraphQLFieldNode, GraphQLTypeNode } from './types'

const TYPES_MAPPING = {
  Int: 'number',
  Float: 'float',
  String: 'string',
  ID: 'id',
  Boolean: 'boolean',
  json: 'object',
  jsonb: 'object',
  bigint: 'number',
}

class Property extends BaseProperty {
  gqlFieldDefinitionNode: any

  pkProperty: string

  constructor(
    gqlDefinitionNode: GraphQLFieldNode,
    pkProperty: string,
  ) {
    super({ path: gqlDefinitionNode.name })

    this.gqlFieldDefinitionNode = gqlDefinitionNode
    this.pkProperty = pkProperty
  }

  getType(node: GraphQLTypeNode): string | null {
    if (node.name) return node.name

    if (!node.ofType) return null

    return this.getType(node.ofType)
  }

  name(): string {
    return this.gqlFieldDefinitionNode.name
  }

  isEditable(): boolean {
    return !this.isId()
      && !this.isArray()
      && this.gqlFieldDefinitionNode.type.name !== 'jsonb'
  }

  isVisible(): boolean {
    // fields containing password are hidden by default
    return !this.name().match('password')
  }

  isId(): boolean {
    return ['id', this.pkProperty].includes(this.name().toLowerCase())
  }

  // eslint-disable-next-line class-methods-use-this
  reference(): string | null {
    if (this.gqlFieldDefinitionNode.description && this.gqlFieldDefinitionNode.description.includes('relationship')) {
      return this.gqlFieldDefinitionNode.name
    }

    return null
  }

  isArray(): boolean {
    return this.gqlFieldDefinitionNode.type.kind === 'LIST'
      || (
        this.gqlFieldDefinitionNode.type.kind === 'NON_NULL'
        && this.gqlFieldDefinitionNode.type.ofType
        && this.gqlFieldDefinitionNode.type.ofType.kind === 'LIST')
  }

  type(): PropertyType {
    if (this.reference()) {
      return 'reference'
    }

    const namedTypeNode = this.getType(this.gqlFieldDefinitionNode.type)

    if (!namedTypeNode) return 'string'

    return TYPES_MAPPING[namedTypeNode] || 'string'
  }

  isSortable(): boolean {
    return ['string', 'number'].includes(this.type())
  }

  isRequired(): boolean {
    return this.gqlFieldDefinitionNode.type.kind === 'NON_NULL'
  }
}

export default Property
