import { BaseResource, BaseRecord, ParamsType } from 'admin-bro'
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  gql,
  HttpLink,
} from '@apollo/client'
import fetch from 'cross-fetch'
import Property from './property'
import {
  constructListArgs,
  getQueryOrMutationName,
  constructInsertArgs,
  constructUpdateArgs,
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
const buildResource = async (
  options: HasuraResourceOptions,
): Promise<BaseResource> => {
  class Resource extends BaseResource {
    graphqlEndpoint: string;

    dbType: string;

    resourceName: string;

    pkProperty: string;

    dbName: string;

    client: ApolloClient<NormalizedCacheObject>;

    fields: GraphQLFieldNode[];

    constructor() {
      super()
      this.dbType = 'hasura'
      this.dbName = options.parent || 'hasura'
      this.graphqlEndpoint = options.endpoint
      this.resourceName = options.name
      this.pkProperty = options.pkProperty
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
      this.fields = options.schema.types.find(
        (type) => type.name === options.name,
      ).fields
    }

    getQueryProperties() {
      return this.properties()
        .filter(
          (property) => property.type() !== 'reference' && !property.isArray(),
        )
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
      return this.fields
        .filter((field) => !field.description || !field.description.includes('relationship'))
        .map((field) => new Property(field, this.pkProperty))
    }

    property(name: string) {
      return this.properties().find((p) => p.name() === name) || null
    }

    async count() {
      const queryName = getQueryOrMutationName(this.resourceName, 'count')

      const response = await this.client.query({
        query: gql(`
          query ${queryName} {
            ${queryName} {
              aggregate {
                count
              }
            }
          }
        `),
      })

      return response.data[queryName].aggregate.count
    }

    async find(query, { limit = 2, offset = 0, sort }) {
      const queryName = getQueryOrMutationName(this.resourceName, 'find')

      const { filters } = query
      const properties = this.getQueryProperties()

      const response = await this.client.query({
        query: gql(`
          query ${queryName} {
            ${queryName}${constructListArgs({ limit, offset, sort, filters })} {
              ${properties.join(' ')}
            }
          }
        `),
      })

      return response.data[queryName].map(
        (result) => new BaseRecord(result, this),
      )
    }

    async findOne(id: string) {
      const queryName = getQueryOrMutationName(this.resourceName, 'findOne')

      const properties = this.getQueryProperties()

      const response = await this.client.query({
        query: gql(`
          query ${queryName} {
            ${queryName}(${this.pkProperty}: "${id}") {
              ${properties.join(' ')}
            }
          }
        `),
      })

      return new BaseRecord(response.data[queryName], this)
    }

    async findMany(ids: Array<string>) {
      const queryName = getQueryOrMutationName(this.resourceName, 'findMany')

      const properties = this.getQueryProperties()

      const response = await this.client.query({
        query: gql(`
          query ${queryName} {
            ${queryName}${constructListArgs({ filters: { [this.pkProperty]: { path: `${this.pkProperty}`, value: ids } } })} {
              ${properties.join(' ')}
            }
          }
        `),
      })

      return response.data[queryName].map(
        (result) => new BaseRecord(result, this),
      )
    }

    async create(params: Record<string, any>) {
      const mutationName = getQueryOrMutationName(this.resourceName, 'create')

      const properties = this.getQueryProperties()

      const response = await this.client.mutate({
        mutation: gql(`
          mutation ${mutationName} {
            ${mutationName}(objects: ${constructInsertArgs(params)}) {
              returning {
                ${properties.join(' ')}
              }
            }
          }
        `),
      })

      return new BaseRecord(response.data[mutationName].returning[0], this)
    }

    async delete(id: string) {
      const mutationName = getQueryOrMutationName(this.resourceName, 'delete')

      const properties = this.getQueryProperties()

      await this.client.mutate({
        mutation: gql(`
          mutation ${mutationName} {
            ${mutationName}(${this.pkProperty}: "${id}") {
              ${properties.join(' ')}
            }
          }
        `),
      })
    }

    async update(id: string, params: Record<string, any>): Promise<ParamsType> {
      const mutationName = getQueryOrMutationName(this.resourceName, 'update')

      const properties = this.getQueryProperties()

      const response = await this.client.mutate({
        mutation: gql(`
          mutation ${mutationName} {
            ${mutationName}${constructUpdateArgs(id, this.pkProperty, params)} {
              ${properties.join(' ')}
            }
          }
        `),
      })

      return new BaseRecord(response.data[mutationName], this)
    }
  }

  return new Resource()
}

export default buildResource
