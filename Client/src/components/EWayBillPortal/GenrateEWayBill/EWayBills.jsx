import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Paper,
    Box,
    Button,
    Snackbar,
    Alert
} from "@mui/material";
import EwayBillTokenGenerator from "./genrateToken";
import NoDataAlert from '../../Alert/Alert';
import { HashLoader } from 'react-spinners';
import "../GenrateEWayBill/EWayBills.css"
import io from 'socket.io-client';
import { AiOutlineImport } from 'react-icons/ai';
import SearchBar from "../../../Common/SearchBar/SearchBar";
import ImportButton from "../../../Common/Buttons/Import";

const apikey = process.env.REACT_APP_API
const API_URL = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybillsbydate";
const API_URL_GET = `${apikey}/get-eway-bills`;
const DETAILS_API_URL = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybill";
const socketURL = 'http://localhost:8080';

const HEADERS = {
    ip_address: "",
    client_id: process.env.REACT_APP_EWAYBILL_CLIENT_ID,
    client_secret: process.env.REACT_APP_EWAYBILL_CLIENT_SECRET,
    gstin: process.env.REACT_APP_EWAYBILL_GSTIN,
};

// Table Style
const tableCellStyleHeader = {
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    zIndex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'blue',
    backgroundColor: "#aeb3b2",
};

const tableCellStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
};

const EWayBills = ({ fromDate }) => {
    const [ewayBills, setEwayBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [isEmpty, setIsEmpty] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [ewayBillInput, setEwayBillInput] = useState('');

    // Snackbar state for success/failure messages
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    //Socket IO implementation
    useEffect(() => {
        const socket = io(socketURL);
        socket.on('connect', () => {
        });

        socket.on('createdata', () => {
            fetchAllEwayBillData();
        });

        socket.on('disconnect', () => {
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Format the date
    const formatDate = (date) => {
        const d = new Date(date);
        const day = ("0" + d.getDate()).slice(-2);
        const month = ("0" + (d.getMonth() + 1)).slice(-2);
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    //Formated Date at the time of insert the data into the table.
    const formatteddatesForInsert = (date) => {
        const datePart = date.split(' ')[0];
        const [day, month, year] = datePart.split('/');
        return `${year}-${month}-${day}`;
    };

    // GET All eway bill data from the database.
    const fetchAllEwayBillData = async () => {
        try {
            const response = await axios.get(API_URL_GET, {
                params: { ewayBillDate: fromDate },
                headers: HEADERS,
            });

            if (response.status === 200) {
                const data = response.data.data;
                setEwayBills(data);
                setFilteredBills(data);
                setIsEmpty(data.length === 0);
            } else {
                setError("Failed to fetch E-Way Bills.");
                setIsEmpty(true);
            }
        } catch (err) {
            console.error("Error fetching E-Way Bills:", err);
            setIsEmpty(true);
        }
    };

    useEffect(() => {
        fetchAllEwayBillData()
    }, [])

    // Function to fetch details for each remaining E-Way Bill number
    const fetchAllEwayBillDetails = async (ewbNos, token) => {
        const details = [];
        for (let ewbNo of ewbNos) {
            const detail = await fetchEwayBillDetails(ewbNo, token);
            if (detail) {
                details.push(detail);
            }
        }
        return details;
    };

    // Function to fetch individual E-Way Bill details
    const fetchEwayBillDetails = async (ewbNo, token) => {
        try {
            const response = await axios.get(DETAILS_API_URL, {
                params: { email: process.env.REACT_APP_EWAYBILL_EMAIL, ewbNo },
                headers: {
                    ...HEADERS,
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.data || {};
        } catch (error) {
            console.error(`Error fetching details for EWB No: ${ewbNo}`, error);
            return null;
        }
    };

    // Function to send the E-Way Bill details to the backend API to store in the database
    const createEwayBillInDatabase = async (ewayBillDetails, token) => {
        try {
            const dataToSend = ewayBillDetails.map(bill => {
                const validEwayBillDate = formatteddatesForInsert(bill.ewayBillDate);
                const validateDocdate = formatteddatesForInsert(bill.docDate);
                return {
                    supplyType: bill.supplyType,
                    ewbNo: bill.ewbNo,
                    ewayBillDate: validEwayBillDate,
                    docNo: bill.docNo,
                    docDate: validateDocdate,
                    fromPlace: bill.fromPlace,
                    fromStateCode: bill.fromStateCode,
                    fromAddr1: bill.fromAddr1,
                    fromAddr2: bill.fromAddr2,
                    fromGstin: bill.fromGstin,
                    toAddr1: bill.toAddr1,
                    toAddr2: bill.toAddr2,
                    toPlace: bill.toPlace,
                    toStateCode: bill.toStateCode,
                    toGstin: bill.toGstin,
                    vehicleNo: bill.VehiclListDetails[0]?.vehicleNo,
                    taxableAmount: bill.itemList[0]?.taxableAmount,
                    cgstValue: bill.cgstValue,
                    sgstValue: bill.sgstValue,
                    igstValue: bill.igstValue,
                    hsnCode: bill.itemList[0]?.hsnCode,
                    productId: bill.itemList[0]?.productId,
                    productName: bill.itemList[0]?.productName,
                    transporterId: bill.transporterId,
                    actualDist: bill.actualDist,
                    quantity: bill.itemList[0]?.quantity,
                };
            });
            const response = await axios.post(
                `${apikey}/create-eway-bill`,
                dataToSend,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response;
        } catch (error) {
            console.error('Error creating E-Way Bill in database:', error);
            setError('Failed to create E-Way Bills in the database.');
            return null;
        }
    };

    //Fetch Eway bill details
    const fetchAndProcessEwayBills = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            // Generate token for authentication
            const { generateToken } = EwayBillTokenGenerator();
            const tokenResponse = await generateToken();

            if (tokenResponse) {
                const token = tokenResponse.token;

                const processedEwbNumbers = ewayBillInput
                    .replace(/\s+/g, '')
                    .match(/\d{12}(\.00)?/g)
                    ?.map((num) => (num.endsWith(".00") ? num.slice(0, -3) : num))
                    .map(Number) || [];
                const ewbNumbers = processedEwbNumbers;
                const removeEwayBillsResponse = await axios.post(
                    `${apikey}/check-remove-eway-bills`,
                    ewbNumbers,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (removeEwayBillsResponse.status === 200) {
                    const existingEwayBillNos = removeEwayBillsResponse.data.remainingEwayBillNos || [];

                    setIsEmpty(existingEwayBillNos.length === 0);

                    const allDetails = await fetchAllEwayBillDetails(existingEwayBillNos, token);

                    const createEwayBillResponse = await createEwayBillInDatabase(allDetails);

                    if (createEwayBillResponse.status === 201) {
                        setSnackbarMessage('E-Way Bills generated successfully!');
                        setSnackbarSeverity('success');
                    } else {
                        setSnackbarMessage('Failed to store E-Way Bills.');
                        setSnackbarSeverity('error');
                    }
                }
                else {
                    setSnackbarMessage("Failed to check E-Way Bills in the database.");
                    setSnackbarSeverity('error');
                }
            } else {
                setSnackbarMessage("No valid E-Way Bill numbers found.");
                setSnackbarSeverity('error');
            }
        }
        catch (err) {
            console.error("Error:", err);
            setSnackbarMessage("Error occurred while generating the token or fetching data.");
            setSnackbarSeverity('error');
        } finally {
            setIsLoading(false);
            setSnackbarOpen(true);
        }
    };

    // Close the Snackbar
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    //Search Records
    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = ewayBills.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(lowerCaseQuery)
            )
        );
        setFilteredBills(filtered);
    }, [searchQuery, ewayBills]);



    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Paper>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <Box sx={{ padding: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                    label="Please Enter E-Way Bill numbers.."
                    value={ewayBillInput}
                    autoComplete="off"
                    onChange={(e) => setEwayBillInput(e.target.value)}
                    sx={{ flexGrow: 1, marginRight: 2 }}
                />

                <ImportButton
                    onClick={fetchAndProcessEwayBills}
                    isLoading={isLoading}
                    disabled={isLoading || !ewayBillInput}
                    buttonText={"Import Portal data"}
                />
            </Box>

            <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </Box>

            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner-container">
                        <HashLoader color="#007bff" loading={isLoading} size={80} />
                    </div>
                </div>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                sx={{
                    width: '100%',
                    textAlign: 'right'
                }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="success"
                    variant="filled"
                    sx={{ width: '30%', height: "5vh" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {isEmpty ? (
                <NoDataAlert />
            ) : (
                <>
                    <TableContainer style={{
                        maxWidth: '98%',
                        margin: '0 auto',
                        height: "70vh"
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={tableCellStyleHeader}>EWB No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Supply Type</TableCell>
                                    <TableCell style={tableCellStyleHeader}>EwayBill Date</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Doc No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Doc Date</TableCell>
                                    <TableCell style={tableCellStyleHeader}>From Place</TableCell>
                                    <TableCell style={tableCellStyleHeader}>FromState Code</TableCell>
                                    <TableCell style={tableCellStyleHeader}>FromAddr1</TableCell>
                                    <TableCell style={tableCellStyleHeader}>FromAddr2</TableCell>
                                    <TableCell style={tableCellStyleHeader}>From Pincode</TableCell>
                                    <TableCell style={tableCellStyleHeader}>To Place</TableCell>
                                    <TableCell style={tableCellStyleHeader}>ToState Code</TableCell>
                                    <TableCell style={tableCellStyleHeader}>To GSTIN</TableCell>
                                    <TableCell style={tableCellStyleHeader}>ToAddr1</TableCell>
                                    <TableCell style={tableCellStyleHeader}>ToAddr2</TableCell>
                                    <TableCell style={tableCellStyleHeader}>ToAddr2</TableCell>
                                    <TableCell style={tableCellStyleHeader}>To Place</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Vehicle No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Taxable Amount</TableCell>
                                    <TableCell style={tableCellStyleHeader}>CGST Value</TableCell>
                                    <TableCell style={tableCellStyleHeader}>SGST Value</TableCell>
                                    <TableCell style={tableCellStyleHeader}>IGST Value</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Product</TableCell>
                                    <TableCell style={tableCellStyleHeader}>HSN</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Transporter Id</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Actual Dist</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Quantity</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBills
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((bill, index) => (
                                        bill ? (
                                            <TableRow key={index}>
                                                <TableCell style={tableCellStyle}>{bill.ewbNo}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.supplyType}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.ewayBillDate}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.docNo}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.docDate}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromPlace}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromStateCode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromAddr1}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromAddr2}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromPincode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toPlace}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toStateCode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toGstin}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toAddr1}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toAddr2}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toAddr2}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toPlace}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.vehicleNo}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.taxableAmount}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.cgstValue}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.sgstValue}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.igstValue}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.productName}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.hsnCode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.transporterId}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.actualDist}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.quantity}</TableCell>
                                            </TableRow>
                                        ) : null
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={filteredBills.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[15, 50, 100]}
                    />
                </>
            )}
        </Paper>
    );
};

export default EWayBills;
