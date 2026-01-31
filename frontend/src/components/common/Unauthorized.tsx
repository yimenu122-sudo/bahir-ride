import React from 'react';

const Unauthorized: React.FC = () => (
  <div className="error-page" style={{ textAlign: 'center', padding: '50px' }}>
    <h1>403 - Access Denied</h1>
    <p>You do not have the required permissions to view this dashboard.</p>
    <button className="btn-primary" onClick={() => window.history.back()}>Go Back</button>
  </div>
);

export default Unauthorized;
