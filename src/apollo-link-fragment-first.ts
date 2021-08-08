import { ApolloLink, FetchResult, NextLink, Observable, Operation } from '@apollo/client/core';
import { DefinitionNode, FieldNode, OperationDefinitionNode, SelectionNode } from 'graphql';

export default class ApolloLinkFragmentFirst extends ApolloLink {
  request(operation: Operation, forward: NextLink): Observable<FetchResult> {
    const { cache, fragmentFirst } = operation.getContext();
    if (!fragmentFirst || !cache) {
      return forward(operation);
    }

    const cacheResult = cache.readFragment({
      id: fragmentFirst.id,
      fragment: fragmentFirst.fragment,
    });

    if (cacheResult) {
      const queryDefinitionFirst = operation.query.definitions.find(
        (definition: DefinitionNode): definition is OperationDefinitionNode =>
          definition.kind === 'OperationDefinition' && definition.operation === 'query',
      );

      if (queryDefinitionFirst) {
        const fieldSelectionFirst = queryDefinitionFirst.selectionSet.selections.find(
          (selection: SelectionNode): selection is FieldNode => selection.kind === 'Field',
        );

        if (fieldSelectionFirst) {
          const name = fieldSelectionFirst.alias?.value || fieldSelectionFirst.name.value;

          cache.writeQuery({
            query: operation.query,
            variables: operation.variables,
            data: {
              [name]: cacheResult,
            },
          });

          return new Observable<FetchResult>((observer) => {
            observer.next({
              data: {
                [name]: cacheResult,
              },
            });
            observer.complete();
          });
        }
      }
    }

    return forward(operation);
  }
}
