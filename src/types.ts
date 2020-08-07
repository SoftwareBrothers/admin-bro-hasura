type GraphQLArgNode = {
  name: string;
  description: string | null;
  type: GraphQLTypeNode;
  defaultValue: string | null;
}

type GraphQLTypeNode = {
  kind: string;
  name: string | null;
  ofType: GraphQLTypeNode | null;
}

type GraphQLFieldNode = {
  name: string;
  description: string | null;
  args: GraphQLArgNode[];
  type: GraphQLTypeNode;
  isDeprecated: boolean;
  deprecationReason: string | null;
}

type HasuraResourceOptions = {
  endpoint: string;
  schema: any;
  name: string;
  pkProperty: string;
  parent: string | null;
};

export {
  GraphQLArgNode,
  GraphQLTypeNode,
  GraphQLFieldNode,
  HasuraResourceOptions,
}
