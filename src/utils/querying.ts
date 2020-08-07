import Property from '../property'

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
  default: throw new Error('Query not implemented')
  }
}

const constructListArgs = (params: {
  limit?: number,
  offset?: number,
  sort?: { sortBy?: string, direction: 'asc' | 'desc' },
  filters?: { [field: string]: { path: string, property?: Property, value: any } }
}): string => {
  const { limit, offset, sort, filters } = params
  const args: string[] = []

  if (limit) {
    args.push(`limit: ${limit}`)
  }

  if (offset) {
    args.push(`offset: ${offset}`)
  }

  if (sort) {
    const { sortBy, direction } = sort
    if (sortBy) args.push(`order_by: { ${sortBy}: ${direction} }`)
  }

  if (filters && Object.keys(filters).length) {
    const where = Object.values(filters)
      .map((filter) => {
        const operator = Array.isArray(filter.value) ? '_in' : '_eq'
        const value = Array.isArray(filter.value)
          ? `[${filter.value.map((v) => `"${v}"`)}]`
          : `"${filter.value}"`

        return `${filter.path}: { ${operator}: ${value} }`
      })
      .join(', ')

    args.push(`where: { ${where} }`)
  }

  return `(${args.join(', ')})`
}

const constructInsertArgs = (
  params: { [key: string]: any },
): string => `[{ ${Object.entries(params).map(([key, value]) => `${key}: "${value}"`)} }]`

const constructUpdateArgs = (
  id: string,
  pkPropertyName: string,
  params: { [key: string]: any },
): string => {
  const args = [`pk_columns: { ${pkPropertyName}: "${id}" }`]

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __typename, ...data } = params

  const set = Object.entries(data).map(([key, value]) => `${key}: "${value}"`)

  args.push(`_set: { ${set} }`)

  return `(${args.join(', ')})`
}

export {
  getQueryOrMutationName,
  constructListArgs,
  constructInsertArgs,
  constructUpdateArgs,
}
