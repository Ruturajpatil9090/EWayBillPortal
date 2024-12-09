import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Container,
  Box,
  Paper,
  FormGroup,
  Grid,
} from "@mui/material";
import axios from "axios";
import { initialFormData } from "./InitialEwayBillData";
import { GSPTokenGenerator } from "./AuthTokenEwayBillGenrate";
import { invoiceDataEwayBills } from './InvoiceBody';
import { useNavigate } from "react-router-dom";

const doubleLineStyle = {
  textAlign: "left",
  position: "relative",
  "&::before, &::after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    height: "1px",
    backgroundColor: "black",
  },
  "&::before": {
    top: "-2px",
  },
  "&::after": {
    bottom: "-2px",
  },
  my: 2,
};

const API_URL = process.env.REACT_APP_API;

const EWayBillNEInvoiceGen = ({ saleId }) => {

  const Company_Code = process.env.REACT_APP_COMPANY_CODE;
  const Year_Code = process.env.REACT_APP_YEAR_CODE;

  const [formData, setFormData] = useState(initialFormData);
  const resizableRef = useRef(null);

  const [fetchData, setFetchedData] = useState([]);

  const { generateTokenData } = GSPTokenGenerator();

  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  //Genrate Eway bill Invoice 
  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = await generateTokenData();
    if (!token) {
      return;
    }
    const apiUrl = `${API_URL}/create-invoice`;
    const headers = {
      "Content-Type": "application/json",
    };

    const invoiceData = invoiceDataEwayBills(formData)

    invoiceData.token = token;

    try {
      const response = await axios.post(apiUrl, invoiceData, { headers });
      if (response.data.success) {
        alert('Success:' + response.data.message);
        const result = response.data.result;

        const updateData = {
          AckNo: result.AckNo,
          Irn: result.Irn,
          SignedQRCode: result.SignedQRCode,
        };

        const updateApiUrl = `${API_URL}/update-salesugar?saleid=${saleId}`;

        const updateResponse = await axios.put(updateApiUrl, updateData, { headers });

        if (updateResponse.status === 200) {
          navigate('/ewaybill');
        } else {
          console.error("Update failed with status:", updateResponse.status);
          alert("Update failed: " + updateResponse.status);
        }
        navigate('/ewaybill')
      } else {
        alert('Error:' + response.data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };


  useEffect(() => {
    let isMounted = true;
    const fetchRecord = async () => {
      try {
        const response = await axios.get(`${API_URL}/get_eWayBill_generationData?Company_Code=${Company_Code}&Year_Code=${Year_Code}&saleId=${saleId}`);
        if (response.status === 200) {
          const data = response.data.all_data[0];
          if (isMounted) {
            setFetchedData(response.data);
            setFormData(prevFormData => ({
              ...prevFormData,
              ...data,
            }));
          }
        } else {
          console.error("Failed to fetch data:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setFetchedData([]);
        }
      }
    };
    fetchRecord();
    return () => {
      isMounted = false;
    };
  }, []);

  // Resizer object at the time of resize the modal.
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
      });
    });
    if (resizableRef.current) {
      observer.observe(resizableRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <Paper ref={resizableRef} elevation={3} sx={{ p: 4, marginTop: 2 }}>

        <Typography variant="h4" align="center">
          eWayBill eInvoice
        </Typography>

        <Grid container spacing={6} sx={{ marginTop: -2 }}>
          <Box mt={2}>
            <Grid container spacing={2} sx={{ marginLeft: 55 }}>
              {/* <Grid item xs={8} sm={2}>
                <Button
                  variant="contained"
                  color="primary"
                  // onClick={handleEdit}
                  fullWidth
                >
                  Edit
                </Button>
              </Grid> */}
              {/* <Grid item xs={8} sm={2}>
                <Button
                  variant="contained"
                  color="primary"
                  // onClick={handleCancel}
                  fullWidth
                >
                  Cancel
                </Button>
              </Grid> */}
              <Grid container justifyContent="flex-end">
                <Grid item xs={12} sm={2} mt={2} ml={100}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    fullWidth
                  >
                    Generate eWayBill eInvoice
                  </Button>
                </Grid>
              </Grid>

              {/* <Grid item xs={8} sm={4}>
                <Button
                  variant="contained"
                  color="primary"
                  // onClick={handleUpdatePinCode}
                  fullWidth
                >
                  Update Pincode
                </Button>
              </Grid> */}
            </Grid>
          </Box>
        </Grid>
        <Box
          sx={doubleLineStyle}
        >
          <Typography variant="h6" gutterBottom>
            Transaction Details
          </Typography>
        </Box>
        <FormGroup>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={1} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Supply Type</InputLabel>
                <Select
                  name="supplyType"
                  value={formData.supplyType}
                  onChange={handleChange}
                  size="small"
                  label="Supply Type"
                >
                  <MenuItem value="B2B">B2B</MenuItem>
                  <MenuItem value="SEZWP">SEZWP</MenuItem>
                  <MenuItem value="SEZWOP">SEZWOP</MenuItem>
                  <MenuItem value="EXP">EXP</MenuItem>
                  <MenuItem value="WP">WP</MenuItem>
                  <MenuItem value="EXPWOP">EXPWOP</MenuItem>
                  <MenuItem value="DXEP">DXEP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1.5} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Reverse Charge</InputLabel>
                <Select
                  name="reverseCharge"
                  value={formData.reverseCharge}
                  onChange={handleChange}
                  size="small"
                  label="Reverse Charge"
                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>IGSTOnIntra</InputLabel>
                <Select
                  name="IGSTOnIntra"
                  value={formData.IGSTOnIntra}
                  onChange={handleChange}
                  size="small"
                  label="IGSTOnIntra"
                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={1} marginTop={-2}>
              <TextField
                label="Doc No"
                name="Doc_No"
                value={formData.Doc_No}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={1.1} marginTop={-2}>
              <TextField
                label="Doc Date"
                type="date"
                name="doc_date"
                value={formData.doc_date}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={1.7} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Doc Type</InputLabel>
                <Select
                  name="docType"
                  value={formData.docType}
                  onChange={handleChange}
                  size="small"
                  label="Doc Type"
                >
                  <MenuItem value="INV">Invoice</MenuItem>
                  <MenuItem value="CRN">Credit Note</MenuItem>
                  <MenuItem value="DBN">Debit Note</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Seller Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="billFromGSTNo"
                    value={formData.GST}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    InputLabelProps={{
                      shrink: true,  
                  }}
                  />
                </Grid>
                <Grid item xs={12} sm={8} marginTop={-2}>
                  <TextField
                    label="Legal Name"
                    name="Company_Name_E"
                    value={formData.Company_Name_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="Address_E"
                    value={formData.Address_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    multiline
                    rows={2}
                    InputLabelProps={{
                      shrink: true,  
                  }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    name="billFromAdd"
                    value={formData.City_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Location"
                    name="City_E"
                    value={formData.City_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="PIN"
                    value={formData.PIN}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State"
                    name="billFromState"
                    value={formData.State_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State Code"
                    name="GST"
                    value={formData.GSTStateCode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Phone"
                    name="PHONE"
                    value={formData.PHONE}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Email"
                    name="EmailId"
                    value={formData.EmailId}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    InputLabelProps={{
                      shrink: true,  
                  }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Buyer Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="BuyerGst_No"
                    value={formData.BuyerGst_No}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    InputLabelProps={{
                      shrink: true,  
                  }}
                  />
                </Grid>
                <Grid item xs={12} sm={8} marginTop={-2}>
                  <TextField
                    label="Legal Name"
                    name="Buyer_Name"
                    value={formData.Buyer_Name}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="Buyer_Address"
                    value={formData.Buyer_Address}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    multiline
                    rows={2}
                    InputLabelProps={{
                      shrink: true,  
                  }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    name="BuyerAdd1"
                    value={formData.Buyer_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Location"
                    name="Buyer_City"
                    value={formData.Buyer_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="Buyer_Pincode"
                    value={formData.Buyer_Pincode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State"
                    name="Buyer_State_name"
                    value={formData.Buyer_State_name}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State Code"
                    name="Buyer_State_Code"
                    value={formData.Buyer_State_Code}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Phone"
                    name="Buyer_Phno"
                    value={formData.Buyer_Phno}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Email"
                    name="Buyer_Email_Id"
                    value={formData.Buyer_Email_Id}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Dispatch From
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="DispatchGst_No"
                    value={formData.DispatchGst_No}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    InputLabelProps={{
                      shrink: true,  
                  }}
                  />
                </Grid>
                <Grid item xs={12} sm={8} marginTop={-2}>
                  <TextField
                    label="Legal Name"
                    name="Dispatch_Name"
                    value={formData.Dispatch_Name}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="Dispatch_Address"
                    value={formData.Dispatch_Address}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    name="dispatchAdd"
                    value={formData.DispatchCity_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Location"
                    name="DispatchCity_City"
                    value={formData.DispatchCity_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="Buyer_Pincode"
                    value={formData.Buyer_Pincode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State"
                    name="Dispatch_GSTStateCode"
                    value={formData.Dispatch_GSTStateCode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Dispatch To
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="ShipToGst_No"
                    value={formData.ShipToGst_No}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    InputLabelProps={{
                      shrink: true,  
                  }}
                  />
                </Grid>
                <Grid item xs={12} sm={8} marginTop={-2}>
                  <TextField
                    label="Legal Name"
                    name="ShipTo_Name"
                    value={formData.ShipTo_Name}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="ShipTo_Address"
                    value={formData.ShipTo_Address}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    name="shipToAdd"
                    value={formData.ShipTo_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Location"
                    name="ShipTo_City"
                    value={formData.ShipTo_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="ShipTo_Pincode"
                    value={formData.ShipTo_Pincode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State"
                    name="ShipTo_GSTStateCode"
                    value={formData.ShipTo_GSTStateCode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Item Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Product Name"
                    name="System_Name_E"
                    value={formData.System_Name_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Description"
                    name="System_Name_E"
                    value={formData.System_Name_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="HSN"
                    name="HSN"
                    value={formData.HSN}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Is Service</InputLabel>
                    <Select
                      name="IsService"
                      value={formData.IsService}
                      onChange={handleChange}
                      size="small"
                      label="IsService"
                    >
                      <MenuItem value="Y">Yes</MenuItem>
                      <MenuItem value="N">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Quantity"
                    name="NETQNTL"
                    value={formData.NETQNTL}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Unit Price"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" Assessable Value "
                    name="assessableValue"
                    value={formData.TaxableAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" CGST Value"
                    name="CGSTRate"
                    value={formData.CGSTRate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" SGST Value "
                    name="SGSTRate"
                    value={formData.SGSTRate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" IGST Value "
                    name="IGSTRate"
                    value={formData.IGSTRate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" Cess Value "
                    name="cessValue"
                    value={formData.cessValue}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" Total Invoice Value "
                    name="totalInvoiceValue"
                    value={formData.billAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" State Cess Value "
                    name="stateCessValue"
                    value={formData.stateCessValue}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Discount"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Other Charge"
                    name="otherAmount"
                    value={formData.otherAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="GST Rate"
                    name="GSTRate"
                    value={formData.GSTRate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="CGST Amount"
                    name="CGSTAmount"
                    value={formData.CGSTAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="SGST Amount"
                    name="SGSTAmount"
                    value={formData.SGSTAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="IGST Amount"
                    name="IGSTAmount"
                    value={formData.IGSTAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="CESS Amount"
                    name="cessAmount"
                    value={formData.cessAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Assessable Amount"
                    name="assessableAmount"
                    value={formData.TaxableAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Total Item Amount"
                    name="TaxableAmount"
                    value={formData.billAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Total Inv Amount"
                    name="totalInvAmount"
                    value={formData.TaxableAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Transporter Name"
                    name="transporterName"
                    value={formData.transporterName}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Transporter ID "
                    name="transporterID"
                    value={formData.transporterID}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Approximate Distance(in KM) "
                    name="approximateDistance"
                    value={formData.approximateDistance}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Mode</InputLabel>
                    <Select
                      name="tranceMode"
                      value={formData.tranceMode}
                      onChange={handleChange}
                      size="small"
                      label="Mode"
                    >
                      <MenuItem value="1">Road</MenuItem>
                      <MenuItem value="2">Rail</MenuItem>
                      <MenuItem value="3">Air</MenuItem>
                      <MenuItem value="4">Ship</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel> Vehicle Type </InputLabel>
                    <Select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      size="small"
                      label="  Vehicle Type "
                    >
                      <MenuItem value="R">Regular</MenuItem>
                      <MenuItem value="O">Over Dimensional Cargo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Vehicle Number "
                    name="LORRYNO"
                    value={formData.LORRYNO}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Transport Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Mode Of Payment "
                    name="Mode_of_Payment"
                    value={formData.Mode_of_Payment}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Account Details"
                    name="Account_Details"
                    value={formData.Account_Details}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Branch"
                    name="Branch"
                    value={formData.Branch}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Payee Name"
                    name="payeeName"
                    value={formData.payeeName}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </FormGroup>
      </Paper>
    </div>
  );
};

export default EWayBillNEInvoiceGen;
