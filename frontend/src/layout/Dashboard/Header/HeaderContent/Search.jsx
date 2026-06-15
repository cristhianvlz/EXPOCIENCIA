import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// assets
import SearchOutlined from '@ant-design/icons/SearchOutlined';

// project imports
import menuItem from 'menu-items';
import { useAuth } from 'contexts/AuthContext';

// ==============================|| HELPERS ||============================== //

const normalize = (value) =>
  Array.from(value.normalize('NFD'))
    .filter((char) => {
      const code = char.codePointAt(0);
      return code < 0x0300 || code > 0x036f; // strip combining diacritics
    })
    .join('')
    .toLowerCase();

// flatten the navigation menu into a permission-aware, searchable list
function getSearchableItems(hasPermission) {
  const items = [];

  const walk = (children, group, groupIcon) => {
    children?.forEach((entry) => {
      if (entry.type === 'collapse') {
        walk(entry.children, entry.title, entry.icon);
      } else if (entry.type === 'item' && entry.url && hasPermission(entry.permission)) {
        items.push({ id: entry.id, title: entry.title, url: entry.url, group, icon: entry.icon || groupIcon });
      }
    });
  };

  menuItem.items.forEach((section) => {
    if (section.type === 'group') {
      walk(section.children, section.id === 'group-dashboard' ? 'General' : section.title);
    }
  });

  return items;
}

// ==============================|| HEADER CONTENT - SEARCH ||============================== //

export default function Search() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const items = useMemo(() => getSearchableItems(hasPermission), [hasPermission]);

  // global Ctrl/Cmd + K shortcut
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Box sx={{ width: '100%', ml: { xs: 0, md: 1 } }}>
      <Autocomplete
        id="header-search"
        options={items}
        getOptionLabel={(option) => option.title}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
        filterOptions={(options, state) => {
          const term = normalize(state.inputValue);
          if (!term) return []; // Solo mostrar resultados al escribir
          return options.filter((item) => normalize(item.title).includes(term) || normalize(item.group).includes(term));
        }}
        onChange={(event, newValue) => {
          if (newValue) {
            navigate(newValue.url);
            setInputValue('');
            inputRef.current?.blur();
          }
        }}
        noOptionsText="No se encontraron resultados"
        renderOption={(props, option) => {
          const Icon = option.icon;
          return (
            <li {...props} key={option.id}>
              {Icon && (
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Icon />
                </ListItemIcon>
              )}
              <ListItemText primary={option.title} secondary={option.group} />
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            size="small"
            placeholder="Buscar página (Ctrl + K)..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start" sx={{ pl: 1 }}>
                  <SearchOutlined />
                </InputAdornment>
              )
            }}
          />
        )}
        sx={{ width: { xs: '100%', md: 300 } }}
      />
    </Box>
  );
}
