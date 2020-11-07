import express from 'express'
import AdminBro from 'admin-bro'
import { buildRouter } from '@admin-bro/express'

import buildResource from '../../src/resource'

import graphqlSchema from '../schema.json'

const PORT = 3000

const run = async () => {
  const app = express()

  const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT || '<your hasura graphql url>'

  // GraphQL Schema introspection in .json format is required to build resources, you can fetch it
  // using these commands:
  // $ yarn add get-graphql-schema
  // $ get-graphql-schema <GRAPHQL_ENDPOINT_URL> -j > schema.json
  const Drink = buildResource({
    name: 'drink',
    schema: graphqlSchema.__schema,
    endpoint: graphqlEndpoint,
    pkProperty: 'id',
    relationships: {},
  })

  const Person = buildResource({
    dbName: 'hasura',
    name: 'person',
    schema: graphqlSchema.__schema,
    endpoint: graphqlEndpoint,
    pkProperty: 'person_id',
    relationships: {
      drink: {
        referenceField: 'favorite_drink_id',
        resourceName: 'drink',
      },
    },
  })

  const admin = new AdminBro({
    resources: [
      {
        resource: Drink,
        options: { properties: { 'some_json.test': { type: 'number' } } },
      },
      { resource: Person, options: { listProperties: ['name', 'age'] } },
    ],
    rootPath: '/app',
  })
  const router = buildRouter(admin)

  app.use(admin.options.rootPath, router)

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening at http://localhost:${PORT}`)
  })
}

run()
