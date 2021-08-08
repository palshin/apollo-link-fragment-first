# apollo-link-fragment-first
[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/palshin/apollo-link-fragment-first/blob/main/README.md)
[![ru](https://img.shields.io/badge/lang-ru-green.svg)](https://github.com/palshin/apollo-link-fragment-first/blob/main/README.ru.md)

Apollo Link для извлечения результата запроса из фрагмента.

Допустим, в приложении мы где-то получаем список пользователей с их постами:

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

А в другом месте мы хотим получить название поста по его ID:

```graphql
query POST_ONE($id: ID!) {
  post(id: $id) {
    id
    name
  }
}
```

Информацию о взаимосвязи результатов запросов ```USERS_ALL_WITH_POSTS``` и ```POST_ONE``` нельзя получить из типов (или, другими словами, логика выборки данных для ```POST_ONE``` известна только серверу, и Apollo может только предполагать, есть ли данные в кеше или нет). Поэтому Apollo в данном случае сделает запрос на сервер, несмотря на то что данные для запроса уже загружены в кеш. Пакет позволяет решить эту проблему путем указания нужного фрагмента в контексте запроса.

## Как использовать

Для начала подключить линк в экземпляр ```ApolloClient```:

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

Теперь в запросе для ```Apollo``` в опции ```context``` можно передать фрагмент, который соответствует результату запроса:

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
      id: 'Post:1',
      fragment: POST_FRAGMENT,
    }
  }
})
```

Если кеш Apollo уже содержит данные для фрагмента в ```fragmentFirst```, линк прервет запрос и запишет данные фрагмента в кеш, в результат запроса ```POST_ONE```.

<details>
  <summary>Еще пример</summary>

```js
const POST_FRAGMENT = gql`
  fragment post on Post {
    id
    name
  }
`;

const POSTS_ALL = gql`
  query POSTS_ALL {
    posts {
      ...post
      content
      createdAt
      publishedAt
      author {
        id
        name
      }
    }
  }
  ${POST_FRAGMENT}
`;

const POST_ONE = gql`
  query POST_ONE($id: ID!) {
    post(id: $id) {
      ...post
    }
  }
  ${POST_FRAGMENT}
`;

// сделает 1 запрос на сервер
const { data: data1 } = await apolloClient.query({
  query: POSTS_ALL,
});

// не будет делать запрос на сервер, запишет фрагмент в результат запроса
const { data: data2 } = await apolloClient.query({
  query: POST_ONE,
  variables: {
    id: 1,
  },
  context: {
    fragmentFirst: {
      id: 'Post:1',
      fragment: POST_FRAGMENT,
    }
  }
});
```
</details>


## Vue Apollo

Все так же, как и в случае использования непосредственно через экземпляр ```ApolloClient```. Но так как ```Vue Apollo``` превращает ```context``` в вычисляемое свойство, мы можем использовать данные компонента для вычисления id фрагмента:

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
