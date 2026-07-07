import { RouterProvider } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createUploadLink } from 'apollo-upload-client';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';
import { AuthProvider } from 'contexts/AuthContext';

import ScrollTop from 'components/ScrollTop';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

const uploadLink = createUploadLink({
  uri: `http://${window.location.hostname}:8000/graphql/`,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `JWT ${token}` : "",
    }
  }
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      if (err.message.includes('Signature has expired') || err.message.includes('Error decoding signature')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permisos');
        window.location.href = '/login';
      }
    }
  }
  if (networkError && networkError.statusCode === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permisos');
    window.location.href = '/login';
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, uploadLink]),
  cache: new InMemoryCache()
});

export default function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <ThemeCustomization>
          <ScrollTop>
            <RouterProvider router={router} />
          </ScrollTop>
        </ThemeCustomization>
      </AuthProvider>
    </ApolloProvider>
  );
}
