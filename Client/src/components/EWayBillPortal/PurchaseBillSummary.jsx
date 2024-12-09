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
    TableSortLabel,
} from '@mui/material';
import axios from 'axios';
import NoDataAlert from '../Alert/Alert';
import SearchBar from '../../Common/SearchBar/SearchBar';

const apikey = process.env.REACT_APP_API;
const Company_Code = process.env.REACT_APP_COMPANY_CODE;
const Year_Code = process.env.REACT_APP_YEAR_CODE;

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

const PurchaseBillSummary = ({ fromDate }) => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [page, setPage] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `${apikey}/purchasebill-reportdata`,
                    {
                        params: {
                            doc_date: fromDate,
                            Company_Code: Company_Code,
                            Year_Code: Year_Code,
                        },
                    }
                );
                setData(response.data);
                setFilteredData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setData([]);
                setFilteredData([]);
            }
        };
        fetchData();
    }, [fromDate]);

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
            <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </Box>

            {filteredData.length === 0 ? (
                <NoDataAlert />
            ) : (
                <>
                    <TableContainer component={Paper} style={{
                        maxWidth: '100%',
                        margin: '0 auto',
                        height: "70vh"
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={tableCellStyleHeader}>
                                        <TableSortLabel
                                            active={sortConfig.key === 'SR_No'}
                                            direction={sortConfig.key === 'SR_No' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('SR_No')}
                                        >
                                            SR No
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell style={tableCellStyleHeader}>
                                        <TableSortLabel
                                            active={sortConfig.key === 'OurNo'}
                                            direction={sortConfig.key === 'OurNo' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('OurNo')}
                                        >
                                            Our No
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell style={tableCellStyleHeader}>MillInvoiceNo</TableCell>
                                    <TableCell style={tableCellStyleHeader}>MillEwayBill_NO</TableCell>
                                    <TableCell style={tableCellStyleHeader}>FromGSTNo</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Party Code</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Party Name</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Party Name</TableCell>
                                    <TableCell style={tableCellStyleHeader}>FromStateCode</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Date</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Vehicle_No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Quintal</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Rate</TableCell>
                                    <TableCell style={tableCellStyleHeader}>TaxableAmount</TableCell>
                                    <TableCell style={tableCellStyleHeader}>CGST</TableCell>
                                    <TableCell style={tableCellStyleHeader}>SGST</TableCell>
                                    <TableCell style={tableCellStyleHeader}>IGST</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Payable_Amount</TableCell>
                                    <TableCell style={tableCellStyleHeader}>DO</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell style={tableCellStyle}>{row.SR_No}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.OurNo}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.MillInvoiceNo}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.MillEwayBill_NO}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.FromGSTNo}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Party_Code}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Party_Name}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.millshortname}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.FromStateCode}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Date}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Vehicle_No}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Quintal}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Rate}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.TaxableAmount}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.CGST}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.SGST}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.IGST}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Payable_Amount}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.DO}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[15, 50, 100]}
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

export default PurchaseBillSummary;
