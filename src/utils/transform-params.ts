import flat from 'flat'

const transformParams = (params: { [key: string]: any }): { [key: string]: any } => {
  const unflattenedParams: { [key: string]: any } = flat.unflatten(params)

  return Object.keys(unflattenedParams).reduce((memo, param) => {
    const value = unflattenedParams[param]
    const isObject = typeof value === 'object'
      && value.constructor.name === 'Object'

    if (!isObject) {
      memo[param] = value

      return memo
    }

    if (value[param]) {
      memo[param] = value[param]
    }

    return memo
  }, {})
}

export default transformParams
