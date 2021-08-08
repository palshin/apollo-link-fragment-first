/// <reference types="zen-observable" />
import { ApolloLink, FetchResult, NextLink, Observable, Operation } from '@apollo/client/core';
export default class ApolloLinkFragmentFirst extends ApolloLink {
    request(operation: Operation, forward: NextLink): Observable<FetchResult>;
}
