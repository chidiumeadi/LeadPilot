import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Foundation from './pages/Foundation'

// Phase 0: this only proves the routing setup works.
// Real application routes are added in later phases.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Foundation />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
