import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Box,
    Checkbox,
    Button,
    Snackbar,
    Alert,
    TableSortLabel,
} from '@mui/material';
import axios from 'axios';
import NoDataAlert from '../Alert/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import io from 'socket.io-client';
import EWayBillNEInvoiceGen from '../EwayBillGenrateProcess/EWayBillGenrationProcess.jsx';
import EWayBillReport from '../../Reports/EWayReport/EWayBillReport.jsx';
import SaleBillReport from '../../Reports/SaleBillReport/SaleBillReport.jsx';
import SearchBar from '../../Common/SearchBar/SearchBar.jsx';
import PrintButton from "../../Common/Buttons/Print.jsx"

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

const apikey = process.env.REACT_APP_API;
const socketURL = 'http://localhost:8080';

const GenerateEwayBill = ({ fromDate }) => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [page, setPage] = useState(0);
    const [selectedSaleIds, setSelectedSaleIds] = useState([]);
    const [selectedSaleIdsForSaleBill, setSelectedSaleIdsForSaleBill] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [showEwayBillReport, setShowEwayBillReport] = useState(false);
    const [saleBilReport, setSaleBilReport] = useState(false);


    // Fetch data from API
    useEffect(() => {
        fetchData();
    }, [fromDate]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        if (isNaN(date)) return '';

        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(
                `${apikey}/getMatchingPurchaseewaybills`,
                { params: { doc_date: fromDate } }
            );
            setData(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setData([]);
            setFilteredData([]);
        }
    };

    //Socket IO implementation
    useEffect(() => {
        const socket = io(socketURL);
        socket.on('connect', () => {
        });

        socket.on('updatedocno', () => {
            fetchData();
        });

        socket.on('updatesalesugar', () => {
            fetchData();
        });

        socket.on('disconnect', () => {
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Handle search functionality
    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = data.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(lowerCaseQuery)
            )
        );
        setFilteredData(filtered);
    }, [searchQuery, data]);

    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle checkbox change
    const handleCheckboxChange = (rowIndex, isChecked, saleid) => {
        const updatedData = [...filteredData];
        updatedData[rowIndex].isSelected = isChecked;
        setFilteredData(updatedData);
        if (isChecked) {
            setSelectedSaleIds((prevIds) => [...prevIds, saleid]);
        } else {
            setSelectedSaleIds((prevIds) => prevIds.filter(id => id !== saleid));
        }
    };

    const handleGenerate = (row) => {
        setSelectedSaleIds(row.saleid);
        setIsOpen(true);
    }

    const handleEWayBillPrint = (row) => {
        setSelectedSaleIds([row.saleid]);
        setShowEwayBillReport(true);
    }

    const handleSaleBillPrint = (row) => {
        setSelectedSaleIdsForSaleBill([row.saleid]);
        setSaleBilReport(true);
    }


    const handleClose = () => {
        setIsOpen(false);
    };

    // Handle generate sale bill and ewaybill button clicks
    const handleSaleBillNo = async () => {
        if (selectedSaleIds.length > 0) {
            try {
                const apiUrl = `${apikey}/update-doc-no`;
                const response = await axios.post(apiUrl, {
                    saleids: selectedSaleIds,
                });
                setSnackbarMessage('Sale Bill Number updated successfully!');
                setOpenSnackbar(true);
            } catch (error) {
                setSnackbarMessage('Failed to update Sale Bill Number');
                setOpenSnackbar(true);
            }
        } else {
            setSnackbarMessage('Please Select the SaleID!');
            setOpenSnackbar(true);
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedData = [...filteredData].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setFilteredData(sortedData);
    };

    return (
        <div>
            {isOpen && (
                <>
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90%',
                        maxHeight: '90%',
                        overflow: 'auto',
                        backgroundColor: 'white',
                        padding: '20px',
                        zIndex: 1000,
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxSizing: 'border-box'
                    }}>
                        <IconButton onClick={handleClose} style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            color: 'gray'
                        }}>
                            <CloseIcon />
                        </IconButton>
                        <EWayBillNEInvoiceGen saleId={selectedSaleIds} />
                    </div>
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999
                    }} onClick={handleClose} />
                </>
            )}

            {showEwayBillReport && (
                <EWayBillReport saleId={selectedSaleIds} />
            )}

            {saleBilReport && (
                <SaleBillReport saleId={selectedSaleIdsForSaleBill} />
            )}

            <Box sx={{ marginBottom: 1, display: 'flex', justifyContent: 'flex-end', height: "5vh" }} mr={2} mb={2}>
                <Button variant="contained" color="secondary" onClick={handleSaleBillNo} disabled={selectedSaleIds.length === 0}>
                    Generate SaleBill
                </Button>
            </Box>

            <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            </Box>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={1000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarMessage.includes('successfully') ? 'success' : 'error'}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {filteredData.length === 0 ? (
                <NoDataAlert />
            ) : (
                <>
                    <TableContainer component={Paper} style={{
                        maxWidth: '98%',
                        margin: '0 auto',
                        height: "75vh"
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={tableCellStyleHeader}>
                                        <TableSortLabel
                                            active={sortConfig.key === 'doc_no'}
                                            direction={sortConfig.key === 'doc_no' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('doc_no')}
                                        >
                                            Doc No
                                        </TableSortLabel>
                                    </TableCell>
                                    {/* <TableCell style={tableCellStyleHeader}>Doc Date</TableCell>
                                    <TableCell style={tableCellStyleHeader}>EWayBill Date</TableCell> */}
                                    <TableCell style={tableCellStyleHeader}>Gst No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>EwayBill GstNO</TableCell>
                                    <TableCell style={tableCellStyleHeader}>NETQNTL</TableCell>
                                    <TableCell style={tableCellStyleHeader}>EWayBill NETQNTL</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Qty Diff</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Vehicle No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Mill Name</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Bill To GST</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Bill To Name</TableCell>
                                    <TableCell style={tableCellStyleHeader}>To GSTIN</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Purchase ID</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Purchaser Name</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Ship To Diff</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Ship To Pincode</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Sub Total</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Taxable Amount</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Taxable Amt Diff</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Sale ID</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Sale Bill No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Generate Sale Bill</TableCell>
                                    <TableCell style={tableCellStyleHeader}>EWay Bill No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Generate Eway Bills</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Sale Bill</TableCell>
                                    <TableCell style={tableCellStyleHeader}>EWay Bill</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((row, index) => {
                                        const isMismatched = row.Gst_No && row.EwayBillGSTN && row.Gst_No !== row.EwayBillGSTN;
                                        return (
                                            <TableRow
                                                key={index}
                                            // style={{
                                            //     backgroundColor: isMismatched ? '#e68282' : 'inherit',
                                            // }}
                                            >
                                                <TableCell style={tableCellStyle}>{row.doc_no}</TableCell>
                                                {/* <TableCell style={tableCellStyle}>{formatDate(row.doc_date)}</TableCell>
                                                <TableCell style={tableCellStyle}>{formatDate(row.EWayBillDate)}</TableCell> */}
                                                <TableCell
                                                    style={{
                                                        ...tableCellStyle,
                                                        position: 'sticky',
                                                        backgroundColor: isMismatched ? '#e68282' : 'inherit',
                                                    }}
                                                >
                                                    {row.Gst_No}
                                                </TableCell>
                                                <TableCell
                                                    style={{
                                                        ...tableCellStyle,
                                                        backgroundColor: isMismatched ? '#e68282' : 'inherit',
                                                    }}
                                                >
                                                    {row.EwayBillGSTN}
                                                </TableCell>
                                                <TableCell style={tableCellStyle}>{row.NETQNTL}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.EwayBillQuantity}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.qtyDiff}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.vehno}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.millname}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.billtogst}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.billtoname}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.toGSTIN}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.purchaseid}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.purcname}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.shipToDiff}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.shiptopin}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.subTotal}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.taxableAmount}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.taxableAmtDiff}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.saleid}</TableCell>
                                                <TableCell style={tableCellStyle}>{row.salebillno}</TableCell>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={row.isSelected || false}
                                                        onChange={(e) =>
                                                            handleCheckboxChange(index, e.target.checked, row.saleid)
                                                        }
                                                        disabled={row.salebillno !== 0}
                                                    />
                                                </TableCell>
                                                <TableCell style={tableCellStyle}>{row.saleewaybillno}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => handleGenerate(row, 'Eway Bill')}
                                                        disabled={
                                                            !(
                                                                row.salebillno !== 0 && row.saleewaybillno === ""
                                                            )
                                                        }
                                                    >
                                                        Generate
                                                    </Button>
                                                </TableCell>

                                                <TableCell>
                                                    <PrintButton
                                                        onClick={() => handleSaleBillPrint(row, 'Sale Report')}
                                                        disabled={row.saleewaybillno === ""}
                                                    />

                                                </TableCell>

                                                <TableCell>
                                                    <PrintButton
                                                        onClick={() => handleEWayBillPrint(row, 'EWayBill Report')}
                                                        disabled={row.saleewaybillno === ""}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[100, 200, 300, 500]}
                        component="div"
                        count={filteredData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </>
            )}
        </div>
    );
};

export default GenerateEwayBill;
