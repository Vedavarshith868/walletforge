import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import SignupOrg from './pages/SignupOrg';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewAccount from './pages/NewAccount';
import AccountDetail from './pages/AccountDetail';
import Transfer from './pages/Transfer';
import Transfers from './pages/Transfers';
import TransferDetail from './pages/TransferDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup-org" element={<SignupOrg />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts/new" element={<NewAccount />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/transfers/:id" element={<TransferDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
