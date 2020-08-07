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

/**
 * Resource options for buildResource method
 * 
 * @alias HasuraResourceOptions
 * @memberof module:@admin-bro/hasura
 */
type HasuraResourceOptions = {
  /**
   * Hasura GraphQL Endpoint
   */
  endpoint: string;
  /**
   * schema.json file
   */
  schema: any;
  /**
   * Resource name (Hasura table name)
   */
  name: string;
  /**
   * Primary key name of the resource
   */
  pkProperty: string;
  /**
   * Parent under which the resource should be displayed
   */
  parent: string | null;
};

export {
  GraphQLArgNode,
  GraphQLTypeNode,
  GraphQLFieldNode,
  HasuraResourceOptions,
}
