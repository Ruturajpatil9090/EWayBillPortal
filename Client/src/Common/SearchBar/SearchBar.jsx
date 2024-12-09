import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <TextField
            label="Search"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto',
                borderRadius: '25px',
                '& .MuiOutlinedInput-root': {
                    borderRadius: '25px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        backgroundColor: '#e1e1e1',
                    },
                    '&.Mui-focused': {
                        boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.2)',
                    },
                },
                '& .MuiInputLabel-root': {
                    fontSize: '1.1rem',
                    color: '#333',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ccc',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                },
            }}
            autoComplete="off"
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon
                            sx={{
                                color: '#7f7f7f',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: '#3b82f6',
                                    transform: 'scale(1.2)',
                                },
                            }}
                        />
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default SearchBar;
