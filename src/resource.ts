import { BaseResource, BaseRecord, ParamsType } from 'admin-bro'
import { ApolloClient, InMemoryCache, NormalizedCacheObject, gql, HttpLink } from '@apollo/client'
import * as graphql from 'gql-query-builder'
import fetch from 'cross-fetch'
import Property from './property'
import {
  getQueryOrMutationName,
  buildFindVariables,
  buildFindOneVariables,
  buildFindManyVariables,
  buildCreateVariables,
  buildDeleteVariables,
  buildUpdateVariables,
} from './utils/querying'
import { GraphQLFieldNode, HasuraResourceOptions } from './types'

/**
 * Method which builds a BaseResource for Hasura
 *
 * @memberof module:@admin-bro/hasura
 * @param {HasuraResourceOptions} options
 * @return {Promise<BaseResource>}
 *
 */
const buildResource = async (options: HasuraResourceOptions): Promise<BaseResource> => {
  class Resource extends BaseResource {
    graphqlEndpoint: string

    private readonly dbType: string = 'hasura'

    resourceName: string

    pkProperty: string

    dbName: string

    client: ApolloClient<NormalizedCacheObject>

    relationships: HasuraResourceOptions['hasura']['relationships'] = {}
    fields: GraphQLFieldNode[]

    constructor() {
      super()
      const { parent: dbName, name, hasura } = options
      const { endpoint, pkProperty, schema, relationships = {} } = hasura

      this.dbName = dbName || 'hasura'
      this.graphqlEndpoint = endpoint
      this.resourceName = name
      this.pkProperty = pkProperty
      this.client = new ApolloClient({
        link: new HttpLink({ uri: this.graphqlEndpoint, fetch }),
        cache: new InMemoryCache(),
        defaultOptions: {
          query: {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all',
          },
        },
      })
      this.relationships = relationships
      this.fields = schema.types.find((type) => type.name === name).fields
    }

    getQueryProperties() {
      return this.properties()
        .map((property) => property.name())
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

    properties(): Property[] {
      const propertiesMap = this.fields
        .reduce((properties, field) => {
          const relationship = this.relationships[field.name]
          if (relationship) {
            const reference = this.fields.find(f => f.name === relationship.referenceField)

            if (!reference) return properties

            properties[reference.name] = new Property(reference, this.pkProperty, relationship.resourceName)
          } else if (!(field.name in properties) && !(field.description || '').includes('relationship')) {
            properties[field.name] = new Property(field, this.pkProperty)
          }

          return properties
        }, {})

        return Object.values(propertiesMap)
    }

    property(name: string) {
      return this.properties().find((p) => p.name() === name) || null
    }

    async count() {
      const queryName = getQueryOrMutationName(this.resourceName, 'count')

      const { query: gqlQuery, variables } = graphql.query(
        {
          operation: queryName,
          fields: [
            {
              aggregate: ['count'],
            },
          ],
        },
        null,
        { operationName: queryName },
      )

      const response = await this.client.query({
        query: gql(gqlQuery),
        variables,
      })

      return response.data[queryName].aggregate.count
    }

    async find(query, { limit = 10, offset = 0, sort }) {
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

      const response = await this.client.query({
        query: gql(gqlQuery),
        variables,
      })

      return response.data[queryName].map((result) => new BaseRecord(result, this))
    }

    async findOne(id: string) {
      const queryName = getQueryOrMutationName(this.resourceName, 'findOne')

      const properties = this.getQueryProperties()

      const { query: gqlQuery, variables } = graphql.query(
        {
          operation: queryName,
          fields: properties,
          variables: buildFindOneVariables({ id }, this.pkProperty),
        },
        null,
        { operationName: queryName },
      )

      const response = await this.client.query({
        query: gql(gqlQuery),
        variables,
      })
      
      return new BaseRecord(response.data[queryName], this)
    }

    async findMany(ids: Array<string>) {
      const queryName = getQueryOrMutationName(this.resourceName, 'findMany')

      const properties = this.getQueryProperties()

      const { query: gqlQuery, variables } = graphql.query(
        {
          operation: queryName,
          fields: properties,
          variables: buildFindManyVariables({ ids }, this.pkProperty, this.resourceName),
        },
        null,
        { operationName: queryName },
      )

      const response = await this.client.query({
        query: gql(gqlQuery),
        variables,
      })

      return response.data[queryName].map((result) => new BaseRecord(result, this))
    }

    async create(params: Record<string, any>) {
      const mutationName = getQueryOrMutationName(this.resourceName, 'create')

      const properties = this.getQueryProperties()

      const { query: gqlMutation, variables } = graphql.mutation(
        {
          operation: mutationName,
          fields: [{
            returning: properties
          }],
          variables: buildCreateVariables(params, this.resourceName),
        },
      )

      const response = await this.client.mutate({
        mutation: gql(gqlMutation),
        variables,
      })

      const { __typename, ...data } = response.data[mutationName].returning[0];

      return new BaseRecord(data, this)
    }

    async delete(id: string) {
      const mutationName = getQueryOrMutationName(this.resourceName, 'delete')

      const properties = this.getQueryProperties()

      const { query: gqlMutation, variables } = graphql.mutation(
        {
          operation: mutationName,
          fields: properties,
          variables: buildDeleteVariables({ id }, this.pkProperty),
        },
      )

      await this.client.mutate({
        mutation: gql(gqlMutation),
        variables
      })
    }

    async update(id: string, params: Record<string, any>): Promise<ParamsType> {
      const mutationName = getQueryOrMutationName(this.resourceName, 'update')

      const properties = this.getQueryProperties()


      const { query: gqlMutation, variables } = graphql.mutation(
        {
          operation: mutationName,
          fields: properties,
          variables: buildUpdateVariables({ id, params }, this.pkProperty, this.resourceName),
        },
      )

      const response = await this.client.mutate({
        mutation: gql(gqlMutation),
        variables,
      })

      const { __typename, ...data } = response.data[mutationName];

      return new BaseRecord(data, this)
    }
  }

  return new Resource()
}

export default buildResource
