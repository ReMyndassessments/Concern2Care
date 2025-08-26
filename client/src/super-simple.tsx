function App() {
  return (
    <div className="min-h-screen bg-purple-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-purple-800 mb-4">Concern2Care</h1>
        <p className="text-xl text-gray-700 mb-8">This page is working!</p>
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/login'}
            className="block w-full px-6 py-3 bg-purple-600 text-white text-lg rounded-lg hover:bg-purple-700"
          >
            Go to Login
          </button>
          <button 
            onClick={() => alert('Button clicked!')}
            className="block w-full px-6 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700"
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;