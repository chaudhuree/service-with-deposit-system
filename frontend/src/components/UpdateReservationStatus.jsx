import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UpdateReservationStatus() {
    const [reservationId, setReservationId] = useState('');
    const [status, setStatus] = useState('in progress');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                navigate('/success');
            } else {
                navigate('/error');
            }
        } catch (error) {
            console.error(error);
            navigate('/error');
        }
    };

    return (
        <div>
            <h2>Update Reservation Status</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Reservation ID:</label>
                    <input type="text" value={reservationId} onChange={(e) => setReservationId(e.target.value)} />
                </div>
                <div>
                    <label>Status:</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <button type="submit">Update</button>
            </form>
        </div>
    );
}

export default UpdateReservationStatus;