import { BaseResource, BaseRecord, BaseProperty, ParamsType } from 'admin-bro'
import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client'
import * as graphql from 'gql-query-builder'
import fetch from 'cross-fetch'
import buildProperty from './property'
import {
  getQueryOrMutationName,
  buildFindVariables,
  buildFindOneVariables,
  buildFindManyVariables,
  buildCreateVariables,
  buildDeleteVariables,
  buildUpdateVariables,
  buildCountVariables,
} from './utils/querying'
import { HasuraResourceOptions } from './types'
import { stripTypename } from './utils/strip-typename'

const DEFAULT_DB_TYPE = 'hasura'

/**
 * Method which builds a BaseResource for Hasura
 *
 * @memberof module:@admin-bro/hasura
 * @param {HasuraResourceOptions} options
 * @return {BaseResource}
 *
 */
const buildResource = (options: HasuraResourceOptions): BaseResource => {
  const fields = options.hasura.schema.types.find((type) => type.name === options.id).fields ?? []
  const { pkProperty, relationships, endpoint: graphqlEndpoint } = options.hasura
  const graphqlClient = new ApolloClient({
    link: new HttpLink({ uri: graphqlEndpoint, fetch }),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
    },
  })

  class Resource extends BaseResource {
    private readonly dbType: string = DEFAULT_DB_TYPE

    resourceName: string

    dbName: string

    constructor(resourceOptions?: Omit<HasuraResourceOptions, 'hasura'>) {
      super(resourceOptions)
      const { parent, id } = options

      this.dbName = parent ? (typeof parent === 'string' ? parent : parent.name) ?? DEFAULT_DB_TYPE : DEFAULT_DB_TYPE
      this.resourceName = id
    }

    private getQueryProperties() {
      return this.properties().map((property) => property.name())
    }

    id(): string {
      return this.resourceName
    }

    name(): string {
      return this.resourceName
    }

    databaseName(): string {
      return this.dbName
    }

    databaseType(): string {
      return this.dbType
    }

    properties(): BaseProperty[] {
      const propertiesMap = fields.reduce((properties, field) => {
        const relationship = relationships[field.name]
        if (relationship) {
          const reference = fields.find((f) => f.name === relationship.referenceField)

          if (!reference) return properties

          properties[reference.name] = buildProperty({
            pkProperty,
            referencedResource: relationship.resourceName,
            graphqlFieldDefinitionNode: reference,
          })
        } else if (!(field.name in properties) && !(field.description || '').includes('relationship')) {
          properties[field.name] = buildProperty({
            pkProperty,
            graphqlFieldDefinitionNode: field,
          })
        }

        return properties
      }, {})

      return Object.values(propertiesMap)
    }

    property(name: string) {
      return this.properties().find((p) => p.name() === name) || null
    }

    async count({ filters = {} }): Promise<number> {
      const queryName = getQueryOrMutationName(this.resourceName, 'count')

      const { query: gqlQuery, variables } = graphql.query(
        {
          operation: queryName,
          fields: [
            {
              aggregate: ['count'],
            },
          ],
          variables: buildCountVariables({ filters }, this.resourceName),
        },
        null,
        { operationName: queryName },
      )

      const response = await graphqlClient.query({
        query: gql(gqlQuery),
        variables,
      })

      return response.data[queryName].aggregate.count
    }

    async find(query, { limit = 10, offset = 0, sort }): Promise<Array<BaseRecord>> {
      const queryName = getQueryOrMutationName(this.resourceName, 'find')

      const { filters } = query
      const properties = this.getQueryProperties()

      const { query: gqlQuery, variables } = graphql.query(
        {
          operation: queryName,
          variables: buildFindVariables({ limit, offset, sort, filters }, this.resourceName),
          fields: properties,
        },
        null,
        { operationName: queryName },
      )

      const response = await graphqlClient.query({
        query: gql(gqlQuery),
        variables,
      })

      return response.data[queryName].map((result) => new BaseRecord(stripTypename(result), this))
    }

    async findOne(id: string): Promise<BaseRecord> {
      const queryName = getQueryOrMutationName(this.resourceName, 'findOne')

      const properties = this.getQueryProperties()

      const { query: gqlQuery, variables } = graphql.query(
        {
          operation: queryName,
          fields: properties,
          variables: buildFindOneVariables({ id }, pkProperty),
        },
        null,
        { operationName: queryName },
      )

      const response = await graphqlClient.query({
        query: gql(gqlQuery),
        variables,
      })

      return new BaseRecord(stripTypename(response.data[queryName]), this)
    }

    async findMany(ids: Array<string>): Promise<Array<BaseRecord>> {
      const queryName = getQueryOrMutationName(this.resourceName, 'findMany')

      const properties = this.getQueryProperties()

      const { query: gqlQuery, variables } = graphql.query(
        {
          operation: queryName,
          fields: properties,
          variables: buildFindManyVariables({ ids }, pkProperty, this.resourceName),
        },
        null,
        { operationName: queryName },
      )

      const response = await graphqlClient.query({
        query: gql(gqlQuery),
        variables,
      })

      return response.data[queryName].map((result) => new BaseRecord(stripTypename(result), this))
    }

    async create(params: Record<string, any>): Promise<ParamsType> {
      const mutationName = getQueryOrMutationName(this.resourceName, 'create')

      const properties = this.getQueryProperties()

      const { query: gqlMutation, variables } = graphql.mutation({
        operation: mutationName,
        fields: [
          {
            returning: properties,
          },
        ],
        variables: buildCreateVariables(params, this.resourceName),
      })

      const response = await graphqlClient.mutate({
        mutation: gql(gqlMutation),
        variables,
      })

      return new BaseRecord(stripTypename(response.data[mutationName].returning[0]), this).toJSON()
    }

    async delete(id: string): Promise<void> {
      const mutationName = getQueryOrMutationName(this.resourceName, 'delete')

      const properties = this.getQueryProperties()

      const { query: gqlMutation, variables } = graphql.mutation({
        operation: mutationName,
        fields: properties,
        variables: buildDeleteVariables({ id }, pkProperty),
      })

      await graphqlClient.mutate({
        mutation: gql(gqlMutation),
        variables,
      })
    }

    async update(id: string, params: Record<string, any>): Promise<ParamsType> {
      const mutationName = getQueryOrMutationName(this.resourceName, 'update')

      const properties = this.getQueryProperties()

      const { query: gqlMutation, variables } = graphql.mutation({
        operation: mutationName,
        fields: properties,
        variables: buildUpdateVariables({ id, params }, pkProperty, this.resourceName),
      })

      const response = await graphqlClient.mutate({
        mutation: gql(gqlMutation),
        variables,
      })

      return new BaseRecord(stripTypename(response.data[mutationName]), this).toJSON()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hasura, ...resourceOpts } = options

  return new Resource(resourceOpts)
}

export default buildResource
