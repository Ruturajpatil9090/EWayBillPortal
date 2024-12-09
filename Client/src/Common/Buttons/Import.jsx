import React from 'react';
import { Button } from '@mui/material';
import { AiOutlineImport } from 'react-icons/ai'; 

const ImportButton = ({ onClick, isLoading, disabled, buttonText }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      sx={{
        height: '5vh',
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)',
        paddingBlock: '0.5rem',
        paddingInline: '1.25rem',
        backgroundColor: 'rgb(0 107 179)',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        gap: '10px',
        fontWeight: 'bold',
        border: '3px solid #ffffff4d',
        outline: 'none',
        overflow: 'hidden',
        fontSize: '15px',
        cursor: 'pointer',
        '&:hover': {
          transform: 'scale(1.05)',
          borderColor: '#fff9',
        },
        '&:hover .icon': {
          transform: 'translate(4px)',
        },
        '&:hover::before': {
          animation: 'shine 1.5s ease-out infinite',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100px',
          height: '100%',
          backgroundImage:
            'linear-gradient(120deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0) 70%)',
          top: '0',
          left: '-100px',
          opacity: '0.6',
        },
      }}
      disabled={disabled}
    >
      {isLoading ? (
        "Processing..."
      ) : (
        <>
          <AiOutlineImport className="icon" />
          {buttonText} 
        </>
      )}
    </Button>
  );
};

export default ImportButton;
