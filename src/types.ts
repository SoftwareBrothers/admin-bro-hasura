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
   * Resource name (Hasura table name)
   */
  name: string;
  /**
   * Parent under which the resource should be displayed
   */
  parent: string | null;
  /**
   * Options specific to Hasura adapter
   */
  hasura: {
    /**
     * Primary key name of the resource
     */
    pkProperty: string;
    /**
     * Hasura GraphQL Endpoint
     */
    endpoint: string;
    /**
     * schema.json file
     */
    schema: any;
    relationships: {
      [graphQLFieldName: string]: {
        resourceName: string;
        referenceField: string;
      }
    }
  }
};

export {
  GraphQLArgNode,
  GraphQLTypeNode,
  GraphQLFieldNode,
  HasuraResourceOptions,
}
