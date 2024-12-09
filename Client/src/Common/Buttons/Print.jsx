import React from 'react';
import { Button } from '@mui/material';
import { AiOutlinePrinter } from 'react-icons/ai'; 

const PrintButton = ({ onClick, disabled, label = "Print" }) => {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={disabled}
      sx={{
        backgroundColor: '#3b82f6',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '8px',
        width: '100px',
        height: '45px',
        transition: '0.3s',
        '&:hover': {
          backgroundColor: '#f3f7fe',
          boxShadow: '0 0 0 5px #3b83f65f',
        },
        '& .icon': {
          marginRight: '8px',
        },
      }}
    >
      <AiOutlinePrinter style={{ marginRight: '8px' }} />
      {label}
    </Button>
  );
};

export default PrintButton;
