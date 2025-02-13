import { useState, useEffect } from 'react';

function ReservationList() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/reservations');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch reservations');
            }
            
            setReservations(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return '#ffc107';
            case 'in progress':
                return '#17a2b8';
            case 'completed':
                return '#28a745';
            case 'cancelled':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            Loading reservations...
        </div>
    );

    if (error) return (
        <div style={{ 
            padding: '20px',
            color: '#721c24',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
        }}>
            Error: {error}
        </div>
    );

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Reservations</h2>
            
            <div style={{ 
                display: 'grid', 
                gap: '15px',
                gridTemplateColumns: '1fr'
            }}>
                {reservations.map(reservation => (
                    <div key={reservation._id} style={{
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '10px'
                        }}>
                            <h3 style={{ margin: 0 }}>
                                Service: {reservation.serviceId.name}
                            </h3>
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: getStatusColor(reservation.status),
                                color: 'white',
                                fontSize: '0.9em'
                            }}>
                                {reservation.status}
                            </span>
                        </div>
                        
                        <div style={{ color: '#666' }}>
                            <p style={{ margin: '5px 0' }}>
                                Reservation ID: {reservation._id}
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                Customer: {reservation.userId.name} ({reservation.userId.email})
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                Service Price: ${reservation.serviceId.price}
                            </p>
                            {reservation.remainingAmount > 0 && (
                                <p style={{ margin: '5px 0' }}>
                                    Remaining Amount: ${reservation.remainingAmount}
                                </p>
                            )}
                            {reservation.refundId && (
                                <p style={{ 
                                    margin: '5px 0',
                                    color: reservation.refundStatus === 'succeeded' ? '#28a745' : '#dc3545'
                                }}>
                                    Refund Status: {reservation.refundStatus}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {reservations.length === 0 && (
                <div style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    marginTop: '20px'
                }}>
                    No reservations found
                </div>
            )}
        </div>
    );
}

export default ReservationList;
