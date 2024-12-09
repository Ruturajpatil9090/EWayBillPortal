import React, { useState, useEffect, useRef } from "react";
import {
    TextField,
    Button,
    Container,
    Typography,
    Box,
    IconButton,
    InputAdornment,
    Snackbar,
    Alert,
} from "@mui/material";
import { AiOutlineUser, AiFillEye, AiFillEyeInvisible, AiFillLock } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Login/Login.css";
import logo from "../../Assets/Gautam.jpg";

const apikey = process.env.REACT_APP_API;

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const navigate = useNavigate();
    
    // Reference for username input
    const usernameInputRef = useRef(null);

    useEffect(() => {
        // Set focus on the username input when the component is mounted
        if (usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, []);  // Empty dependency array ensures this runs only once after the component mounts

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setSnackbarMessage("Please fill in both username and password.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        setLoading(true);
        setError("");

        const loginData = { Login_Name: username, Password: password };

        try {
            const response = await axios.post(`${apikey}/login`, loginData);

            if (response.status === 200) {
                const { user_data, access_token } = response.data;
                sessionStorage.setItem("access_token", access_token);

                setSnackbarMessage("Login successfully!");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
                setTimeout(()=>{
                    navigate("/ewaybill");
                },1000)
            } else {
                setSnackbarMessage("Unexpected response from server.");
                setSnackbarSeverity("error");
                setOpenSnackbar(true);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                setSnackbarMessage(error.response.data.error || "Invalid username or password.");
            } else {
                setSnackbarMessage("Network error. Please try again later.");
            }
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    return (
        <div className="login-wrapper">
            <Snackbar
                open={openSnackbar}
                autoHideDuration={2000}
                onClose={handleSnackbarClose}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    variant="filled"
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Container maxWidth="xs" >
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="logo" />
                </div>

                <Typography variant="h5" gutterBottom className="login-header">
                    Gautam Sugar
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
                    <TextField
                        fullWidth
                        label="Username"
                        variant="outlined"
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        inputRef={usernameInputRef}  // Attach the ref here
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AiOutlineUser />
                                </InputAdornment>
                            ),
                        }}
                        className="input-field"
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type={passwordVisible ? "text" : "password"}
                        variant="outlined"
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AiFillLock />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={togglePasswordVisibility}>
                                        {passwordVisible ? <AiFillEyeInvisible /> : <AiFillEye />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        className="input-field"
                    />

                    {error && (
                        <Typography variant="body2" color="error" className="error-message">
                            {error}
                        </Typography>
                    )}

                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </Button>
                </Box>
            </Container>
        </div>
    );
};

export default LoginForm;
