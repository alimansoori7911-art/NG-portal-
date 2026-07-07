import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './modules/home/pages/HomePage'
import LoginPage from './modules/auth/pages/LoginPage'
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App