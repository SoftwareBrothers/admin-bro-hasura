export const stripTypename = (originalData: { [k: string]: any & { __typename: string } }) => {
  const { __typname, ...data } = originalData;

  return data;
}
