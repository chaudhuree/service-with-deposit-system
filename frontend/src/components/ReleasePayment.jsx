import { useState } from 'react';

function ReleasePayment() {
    const [reservationId, setReservationId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}/release-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to release payment');
            }

            setSuccessMessage('Payment released successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Release Payment</h2>
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
                    {isLoading ? 'Releasing Payment...' : 'Release Payment'}
                </button>
            </form>
        </div>
    );
}

export default ReleasePayment;
