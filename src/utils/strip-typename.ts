export const stripTypename = (originalData: { [k: string]: any & { __typename: string } }) => {
  const { __typename, ...data } = originalData;

  return data;
}
