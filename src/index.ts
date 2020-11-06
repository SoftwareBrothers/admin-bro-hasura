/**
 * @module @admin-bro/hasura
 *
 * @description
 * ### A Hasura adapter for AdminBro.
 *
 * ### Note
 * The adapter in it's current state supports only basic types and doesn't support relationships.
 *
 * #### Installation
 *
 * To install the adapter run
 *
 * ```
 * yarn add @admin-bro/hasura
 * ```
 *
 * ### Usage
 *
 * In order to use it in your project import `buildResource` and `schema.json`
 *
 * You can download your GraphQL `schema.json` using apollo CLI:
 * ```
 *  yarn global add apollo
 *  apollo schema:download --endpoint <your Hasura GraphQL endpoint>
 * ```
 *
 * Example server code:
 * ```javascript
 * const AdminBro = require('admin-bro')
 * const { buildResource } = require('@admin-bro/hasura')
 * const graphqlSchema = require('../schema.json')
 *
 * const graphqlEndpoint = '<your Hasura GraphQL endpoint>'
 * const Person = await buildResource({
 *   endpoint: graphqlEndpoint,
 *   name: 'person',
 *   pkProperty: 'id',
 *   parent: 'Hasura',
 *   schema: graphqlSchema.__schema,
 * })
 *
 * const admin = new AdminBro({
 *   resources: [Person],
 *   // ...other AdminBro options
 * })
 *
 * // ...
 * ```
 */

import buildResource from './resource'

export { buildResource }
