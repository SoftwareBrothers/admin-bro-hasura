import express from 'express'
import AdminBro from 'admin-bro'
import { buildRouter } from '@admin-bro/express'

import buildResource from '../../src/resource'

import graphqlSchema from '../schema.json'

const PORT = 3000

const run = async () => {
  const app = express()

  const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT || '<your hasura graphql url>'

  const Drink = await buildResource({
    endpoint: graphqlEndpoint,
    name: 'drink',
    pkProperty: 'id',
    parent: 'Hasura',
    // eslint-disable-next-line no-underscore-dangle
    schema: graphqlSchema.__schema,
  })

  const Person = await buildResource({
    endpoint: graphqlEndpoint,
    name: 'person',
    pkProperty: 'person_id',
    parent: 'Hasura',
    // eslint-disable-next-line no-underscore-dangle
    schema: graphqlSchema.__schema,
  })

  const admin = new AdminBro({
    resources: [Drink, Person],
  })
  const router = buildRouter(admin)

  app.use(admin.options.rootPath, router)

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening at http://localhost:${PORT}`)
  })
}

run()
