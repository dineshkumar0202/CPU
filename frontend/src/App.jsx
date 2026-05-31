import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Task2Page from './pages/Task2Page';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Task2Page />} />
        {/* Catch-all route to fallback to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
