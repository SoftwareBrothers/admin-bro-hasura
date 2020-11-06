type OriginalData = { [k: string]: any & { __typename: string } };
type StrippedData = Omit<OriginalData, '__typename'>;

export const stripTypename = (
  originalData: { [k: string]: any & { __typename: string } },
): StrippedData => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __typename, ...data } = originalData

  return data
}
