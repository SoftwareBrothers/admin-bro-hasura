/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-globals */
/* eslint-disable camelcase */
import Property from '../property'
import { stripTypename } from './strip-typename'

type FindFilter = { [field: string]: { path: string; property?: Property; value: any } }
type FindFilterOperator = '_in' | '_eq' | '_lte' | '_gte'
type FindVariables = {
  limit?: number
  offset?: number
  order_by?: {
    name: 'order_by'
    type: string
    value: Array<{
      [field: string]: 'asc' | 'desc'
    }>
  }
  where?: {
    name: 'where'
    type: string
    value: {
      [field: string]: {
        [operator in FindFilterOperator]: any
      }
    }
  }
}
type FindOneVariables = {
  [pkProperty: string]: {
    type: string
    value: string | number
  }
}
type FindManyVariables = {
  where: {
    name: 'where'
    type: string
    value: {
      [pkProperty: string]: {
        type: string
        value: string[] | number[]
      }
    }
  }
}
type CreateVariables = {
  objects: {
    type: string
    value: { [key: string]: any }
  }
}
type DeleteVariables = FindOneVariables
type UpdateVariables = {
  pk_columns?: {
    type: string
    value: {
      [pkProperty: string]: string | number
    }
  }
  _set?: { [key: string]: any }
}

const transformFilterValue = (originalValue: any, property?: Property) => {
  const type = Object.prototype.toString.call(originalValue)

  const isArray = type === '[object Array]'
  const isObject = type === '[object Object]'

  if (isArray) return { _in: originalValue }
  if (isObject && property && ['date', 'datetime'].includes(property.type())) {
    const filter: { [key in FindFilterOperator]?: any } = {}
    if (originalValue.to) filter._lte = new Date(originalValue.to).toUTCString()
    if (originalValue.from) filter._gte = new Date(originalValue.from).toUTCString()

    return filter
  }

  return { _eq: originalValue }
}

const whereArgumentFromFilters = (filters?: FindFilter) => {
  if (!filters || Object.keys(filters).length === 0) return {}

  return Object.values(filters).reduce((whereArgs, filter) => {
    if (!filter.value || !filter.property) return whereArgs
    whereArgs[filter.path] = transformFilterValue(filter.value, filter.property)

    return whereArgs
  }, {})
}

const getQueryOrMutationName = (resourceName: string, query: string): string => {
  switch (query) {
  case 'findMany':
  case 'find': {
    return resourceName
  }
  case 'findOne': {
    return `${resourceName}_by_pk`
  }
  case 'create': {
    return `insert_${resourceName}`
  }
  case 'update': {
    return `update_${resourceName}_by_pk`
  }
  case 'delete': {
    return `delete_${resourceName}_by_pk`
  }
  case 'count': {
    return `${resourceName}_aggregate`
  }
  default:
    throw new Error('Query not implemented')
  }
}

const buildFindVariables = (
  {
    limit,
    offset,
    sort = { direction: 'asc' },
    filters,
  }: {
    limit: number
    offset: number
    sort: { sortBy?: string; direction: 'asc' | 'desc' }
    filters?: FindFilter
  },
  resourceName: string,
): FindVariables => {
  const variables: FindVariables = {}

  if (!isNaN(Number(limit))) variables.limit = limit
  if (!isNaN(Number(offset))) variables.offset = offset

  if (sort && sort.sortBy) {
    const { sortBy, direction } = sort

    variables.order_by = {
      name: 'order_by',
      type: `[${resourceName}_order_by!]`,
      value: [{ [sortBy]: direction }],
    }
  }

  if (filters && Object.keys(filters).length) {
    const where = whereArgumentFromFilters(filters)

    variables.where = {
      name: 'where',
      type: `${resourceName}_bool_exp`,
      value: where,
    }
  }

  return variables
}

const buildCountVariables = (
  { filters = {} }: { filters?: FindFilter},
  resourceName: string,
): FindVariables => {
  const variables: FindVariables = {}
  if (filters && Object.keys(filters).length) {
    const where = whereArgumentFromFilters(filters)

    variables.where = {
      name: 'where',
      type: `${resourceName}_bool_exp`,
      value: where,
    }
  }

  return variables
}

const buildFindOneVariables = ({ id }: { id: string }, pkProperty: string): FindOneVariables => ({
  [pkProperty]: {
    type: 'bigint!',
    value: id,
  },
})

const buildFindManyVariables = (
  { ids }: { ids: string[] },
  pkProperty: string,
  resourceName: string,
): FindManyVariables => {
  const where = whereArgumentFromFilters({
    [pkProperty]: {
      value: ids,
      path: pkProperty,
    },
  })

  return {
    where: {
      name: 'where',
      type: `${resourceName}_bool_exp`,
      value: where,
    },
  }
}

const buildCreateVariables = (params: { [key: string]: any }, resourceName: string): CreateVariables => ({
  objects: {
    type: `[${resourceName}_insert_input!]!`,
    value: [params],
  },
})

const buildDeleteVariables = ({ id }: { id: string }, pkProperty: string): DeleteVariables => ({
  [pkProperty]: {
    type: 'bigint!',
    value: id,
  },
})

const buildUpdateVariables = (
  { id, params }: { id: string; params: { [key: string]: any } },
  pkProperty: string,
  resourceName: string,
): UpdateVariables => {
  const variables: UpdateVariables = {}

  variables.pk_columns = {
    type: `${resourceName}_pk_columns_input!`,
    value: {
      [pkProperty]: id,
    },
  }

  variables._set = {
    type: `${resourceName}_set_input!`,
    value: stripTypename(params),
  }

  return variables
}

export {
  getQueryOrMutationName,
  buildFindVariables,
  buildFindOneVariables,
  buildFindManyVariables,
  buildCreateVariables,
  buildDeleteVariables,
  buildUpdateVariables,
  buildCountVariables,
}
