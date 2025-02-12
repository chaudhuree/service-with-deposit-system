import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import UserRegistration from './components/UserRegistration';
import CreateService from './components/CreateService';
import CreateReservation from './components/CreateReservation';
import SuccessPage from './components/SuccessPage';
import ErrorPage from './components/ErrorPage';
import UpdateReservationStatus from './components/UpdateReservationStatus';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <nav>
                    <ul>
                        <li><Link to="/register">Register User</Link></li>
                        <li><Link to="/create-service">Create Service</Link></li>
                        <li><Link to="/create-reservation">Create Reservation</Link></li>
                        <li><Link to="/update-reservation">Update Reservation Status</Link></li>
                    </ul>
                </nav>

                <Routes>
                    <Route path="/register" element={<UserRegistration />} />
                    <Route path="/create-service" element={<CreateService />} />
                    <Route path="/create-reservation" element={<CreateReservation />} />
                    <Route path="/success" element={<SuccessPage />} />
                    <Route path="/error" element={<ErrorPage />} />
                    <Route path="/update-reservation" element={<UpdateReservationStatus />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;