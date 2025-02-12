import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UpdateReservationStatus() {
    const [reservationId, setReservationId] = useState('');
    const [status, setStatus] = useState('in progress');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                if (status === 'cancelled') {
                    if (data.refund) {
                        setSuccessMessage(`Reservation cancelled and deposit refunded. Refund ID: ${data.refund.id}`);
                    } else {
                        setSuccessMessage('Reservation cancelled successfully');
                    }
                } else if (status === 'completed') {
                    setSuccessMessage('Reservation completed and remaining balance charged successfully');
                } else {
                    setSuccessMessage(`Reservation status updated to ${status}`);
                }
                
                // Optional: navigate after a delay to show the success message
                setTimeout(() => {
                    navigate('/success');
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to update reservation status');
            }
        } catch (error) {
            console.error('Error updating reservation:', error);
            setError(error.message || 'Failed to update reservation status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Update Reservation Status</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Reservation ID:
                    </label>
                    <input
                        type="text"
                        value={reservationId}
                        onChange={(e) => setReservationId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                        required
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Status:
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    >
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                
                {status === 'cancelled' && (
                    <div style={{ 
                        marginBottom: '20px',
                        padding: '10px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeeba',
                        borderRadius: '4px'
                    }}>
                        <p style={{ margin: 0, color: '#856404' }}>
                            ⚠️ Cancelling the reservation will initiate a refund of the deposit amount.
                        </p>
                    </div>
                )}

                {status === 'completed' && (
                    <div style={{ 
                        marginBottom: '20px',
                        padding: '10px',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px'
                    }}>
                        <p style={{ margin: 0, color: '#155724' }}>
                            💳 Completing the reservation will charge the remaining balance using the saved payment method.
                        </p>
                    </div>
                )}

                {error && (
                    <div style={{ 
                        marginBottom: '20px',
                        padding: '10px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        color: '#721c24'
                    }}>
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div style={{ 
                        marginBottom: '20px',
                        padding: '10px',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        color: '#155724'
                    }}>
                        {successMessage}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !reservationId}
                    style={{
                        backgroundColor: '#5469d4',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: isLoading || !reservationId ? 'not-allowed' : 'pointer',
                        opacity: isLoading || !reservationId ? 0.7 : 1,
                        width: '100%'
                    }}
                >
                    {isLoading ? 'Updating...' : 'Update Status'}
                </button>
            </form>
        </div>
    );
}

export default UpdateReservationStatus;