import React from 'react';
import { Box, Alert, AlertTitle } from '@mui/material';

const NoDataFound = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '20vh',
                textAlign: 'center',
            }}
        >
            <Alert
                severity="info"
                sx={{
                    fontSize: '1.2rem',
                    padding: '20px',
                    maxWidth: '800px',
                  
                }}
            >
                <AlertTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Data Not Found!
                </AlertTitle>
                There is no data to display at the moment. Please try again later.
            </Alert>
        </Box>
    );
};

export default NoDataFound;
