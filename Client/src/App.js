import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import Router components
import LoginForm from './Pages/Login/Login';
import EWayBillPortal from './components/EWayBillPortal/EWayBillPortalTabs';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/ewaybill" element={<EWayBillPortal />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
