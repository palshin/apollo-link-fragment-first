# apollo-link-fragment-first
[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/palshin/apollo-link-fragment-first/blob/main/README.md)
[![ru](https://img.shields.io/badge/lang-ru-green.svg)](https://github.com/palshin/apollo-link-fragment-first/blob/main/README.ru.md)

Apollo Link to extract the query result from a fragment.

Let's say we get a list of users with their posts somewhere in the application:

```graphql
query USERS_ALL_WITH_POSTS {
  users {
    id
    posts {
      id
      name
    }
  }
}
```

And in another place we want to get the name of the post by its id:

```graphql
query POST_ONE($id: ID!) {
  post(id: $id) {
    id
    name
  }
}
```

Information about the relationship between the results of the ```USERS_ALL_WITH_POSTS``` and ```POST_ONE``` queries cannot be obtained from the types (or, in other words, the logic of fetching data for ```POST_ONE``` is known only to the server, and Apollo can only assume whether there is data in the cache or not). Therefore, in this case, Apollo will make a request to the server, despite the fact that the data for the request has already been loaded into the cache. The package allows you to solve this problem by specifying the desired fragment in the context of the request.

## How to use

To start, connect the link to the ```ApolloClient``` instance:

```js
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client/core'
import gql from 'graphql-tag';
import FragmentFirstLink from 'apollo-link-fragment-first';

const cache = new InMemoryCache();
const link = ApolloLink.from([
  new FragmentFirstLink(),
  // ...
  new HttpLink({
    uri: 'http://remote.address/graphql',
  }),
])
const apolloClient = new ApolloClient({
  link,
  cache,
});
```

Now in the request for Apollo in the ```context``` option, you can pass a fragment that corresponds to the result of the request:

```js
const POST_FRAGMENT = gql`
  fragment post on Post {
    id
    name
  }
`;

apolloClient.query({
  query: gql`
    query POST_ONE($id: ID!) {
      post(id: $id) {
        ...post
      }
    }
    ${POST_FRAGMENT}
  `,
  variables: {
    id: 1
  },
  context: {
    fragmentFirst: {
      id: `Post:1`,
      fragment: POST_FRAGMENT,
    }
  }
})
```

If the Apollo cache already contains data for the fragment in ```fragmentFirst```, the link will abort the request and write the fragment data to the cache, in the result of the request ```POST_ONE```.


## Vue Apollo

Everything is exactly the same as in the case of using it directly through the ```ApolloClient``` instance. But since ```Vue Apollo``` turns ```context``` into a ```computed``` property, we can use the component data to calculate the fragment's id:

```js
export default {
  name: 'PostCard',
  props: {
    id: {
      required: true,
      type: String,
    },
  },
  apollo: {
    post: {
      query: gql`
        query POST_ONE($id: ID!) {
          post(id: $id) {
            ...post
          }
        }
        ${POST_FRAGMENT}
      `,
      variables() {
        return {
          id: this.id,
        };
      },
      context() {
        return {
          fragmentFirst: {
            id: `Post:${this.id}`,
            fragment: POST_FRAGMENT,
          },
        };
      },
    },
  },
}
```
