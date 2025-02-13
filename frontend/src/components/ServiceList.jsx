import { useState, useEffect } from 'react';

function ServiceList() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/services');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch services');
            }
            
            setServices(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            Loading services...
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
            <h2 style={{ marginBottom: '20px' }}>Available Services</h2>
            
            <div style={{ 
                display: 'grid', 
                gap: '15px',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
                {services.map(service => (
                    <div key={service._id} style={{
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>{service.name}</h3>
                        <div style={{ color: '#666' }}>
                            <p style={{ margin: '5px 0' }}>ID: {service._id}</p>
                            <p style={{ margin: '5px 0' }}>Price: ${service.price}</p>
                            {service.description && (
                                <p style={{ margin: '5px 0' }}>{service.description}</p>
                            )}
                            <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#888' }}>
                                Created: {new Date(service.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {services.length === 0 && (
                <div style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    marginTop: '20px'
                }}>
                    No services available
                </div>
            )}
        </div>
    );
}

export default ServiceList;
