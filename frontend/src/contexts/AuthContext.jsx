import { createContext, useContext, useState, useEffect } from 'react';
import { useApolloClient, gql } from '@apollo/client';

const ME_PERMISOS = gql`
  query MePermisos {
    mePermisos
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      idUsuario
      username
      email
      is2faEnabled
      rol {
        idRol
        nombre
      }
      participante {
        nombre
        apellido
        ci
        celular
        expedicion
      }
      tutor {
        nombre
        apellido
        ci
        celular
        codEmpleado
        direccion
        expedicion
      }
      tribunal {
        idTribunal
        nombre
        apellido
        ci
        celular
        especialidad
        direccion
        expedicion
      }
      personal {
        nombre
        apellido
        ci
        cargo
        celular
        direccion
        expedicion
      }
    }
  }
`;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [permisos, setPermisos] = useState(() => {
    try {
      const stored = localStorage.getItem('permisos');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [usuario, setUsuario] = useState(() => {
    try {
      const stored = localStorage.getItem('usuario');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const client = useApolloClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    client.query({ query: ME_QUERY, fetchPolicy: 'network-only' })
      .then(({ data }) => {
        const userData = data?.me || null;
        setUsuario(userData);
        localStorage.setItem('usuario', JSON.stringify(userData));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarPermisos = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setPermisos([]);
      localStorage.removeItem('permisos');
      return;
    }
    try {
      const { data } = await client.query({
        query: ME_PERMISOS,
        fetchPolicy: 'network-only',
      });
      const lista = data?.mePermisos || [];
      setPermisos(lista);
      localStorage.setItem('permisos', JSON.stringify(lista));
    } catch {
      setPermisos([]);
    }
  };

  const cargarUsuario = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUsuario(null);
      localStorage.removeItem('usuario');
      return;
    }
    try {
      const { data } = await client.query({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      });
      const userData = data?.me || null;
      setUsuario(userData);
      localStorage.setItem('usuario', JSON.stringify(userData));
    } catch {
      setUsuario(null);
    }
  };

  const limpiarPermisos = () => {
    setPermisos([]);
    localStorage.removeItem('permisos');
  };

  const limpiarUsuario = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  const hasPermission = (code) => {
    if (!code) return true;
    return permisos.includes(code);
  };

  return (
    <AuthContext.Provider value={{ permisos, usuario, cargarPermisos, cargarUsuario, limpiarPermisos, limpiarUsuario, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
