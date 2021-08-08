var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { ApolloLink, Observable } from '@apollo/client/core';
var ApolloLinkFragmentFirst = (function (_super) {
    __extends(ApolloLinkFragmentFirst, _super);
    function ApolloLinkFragmentFirst() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ApolloLinkFragmentFirst.prototype.request = function (operation, forward) {
        var _a;
        var _b;
        var _c = operation.getContext(), cache = _c.cache, fragmentFirst = _c.fragmentFirst;
        if (!fragmentFirst || !cache) {
            return forward(operation);
        }
        var cacheResult = cache.readFragment({
            id: fragmentFirst.id,
            fragment: fragmentFirst.fragment
        });
        if (cacheResult) {
            var queryDefinitionFirst = operation.query.definitions.find(function (definition) {
                return definition.kind === 'OperationDefinition' && definition.operation === 'query';
            });
            if (queryDefinitionFirst) {
                var fieldSelectionFirst = queryDefinitionFirst.selectionSet.selections.find(function (selection) { return selection.kind === 'Field'; });
                if (fieldSelectionFirst) {
                    var name_1 = ((_b = fieldSelectionFirst.alias) === null || _b === void 0 ? void 0 : _b.value) || fieldSelectionFirst.name.value;
                    cache.writeQuery({
                        query: operation.query,
                        variables: operation.variables,
                        data: (_a = {},
                            _a[name_1] = cacheResult,
                            _a)
                    });
                    return new Observable(function (observer) {
                        var _a;
                        observer.next({
                            data: (_a = {},
                                _a[name_1] = cacheResult,
                                _a)
                        });
                        observer.complete();
                    });
                }
            }
        }
        return forward(operation);
    };
    return ApolloLinkFragmentFirst;
}(ApolloLink));
export default ApolloLinkFragmentFirst;
//# sourceMappingURL=apollo-link-fragment-first.js.map