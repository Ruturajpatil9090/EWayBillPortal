import React, { useState } from 'react';
import { Tabs, Tab, Box, TextField, Button, Stack } from '@mui/material';
import EWayBills from '../EWayBillPortal/GenrateEWayBill/EWayBills';
import PurchaseBillSummary from './PurchaseBillSummary';
import GenrateEwayBill from './GenrateEwayBill';
import { useNavigate } from 'react-router-dom';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { BsArrowUpRightSquareFill } from "react-icons/bs";
import SubmitButton from '../../Common/Buttons/Submit';

const EWayBillPortal = () => {

  // GET the Current Date.
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [value, setValue] = useState(0);
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [submittedFromDate, setSubmittedFromDate] = useState(getCurrentDate());

  const navigate = useNavigate()

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleFromDateChange = (event) => {
    setFromDate(event.target.value);
  };

  const handleSubmit = () => {
    setSubmittedFromDate(fromDate);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  // Determine if the EWayBill tab is active
  const isEWayBillTabActive = value === 1 || value === 2;

  return (
    <div>
      <Box sx={{ marginBottom: 2 }} ml={2} mt={5}>
        <Stack direction="row" spacing={2} justifyContent="flex-start" alignItems="center">
          <TextField
            label="Select Date"
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            disabled={isEWayBillTabActive}
          />

<SubmitButton
        onClick={handleSubmit}
        disabled={isEWayBillTabActive}
        label="Submit"
      />
       
          <Box sx={{ width: '80%' }}>
            <Tabs value={value} onChange={handleChange} aria-label="EWay Bill Tabs" centered  >
              <Tab label="1. Purchase Bill" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }} />
              <Tab label="2. EWayBill" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }} />
              <Tab label="3. Generate EWayBill" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }} />
            </Tabs>
          </Box>

          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#b71c1c',
              },
            }}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Stack>
      </Box>

      <Box >
        {value === 0 && <PurchaseBillSummary fromDate={submittedFromDate} />}
        {value === 1 && <EWayBills fromDate={submittedFromDate} />}
        {value === 2 && <GenrateEwayBill fromDate={submittedFromDate} />}
      </Box>

    </div>
  );
};

export default EWayBillPortal;
