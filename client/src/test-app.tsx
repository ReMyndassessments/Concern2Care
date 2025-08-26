export default function TestApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#3b82f6', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '32px', 
        borderRadius: '8px', 
        boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#2563eb',
          margin: '0 0 16px 0'
        }}>
          REACT IS WORKING!
        </h1>
        <p style={{ 
          margin: '0', 
          color: '#4b5563' 
        }}>
          This confirms the app can render without Tailwind CSS.
        </p>
      </div>
    </div>
  );
}