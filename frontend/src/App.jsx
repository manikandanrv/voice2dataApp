import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import Dashboard from './components/Dashboard';
import TFOWinderProduction from './components/TFOWinderProduction';
import CheeseWinderProduction from './components/CheeseWinderProduction';
import DoublerProductionPrimary from './components/DoublerProductionPrimary';
import GenericPage from './components/GenericPage';
import MachineMaster from './components/MachineMaster';
import MachineTypeMaster from './components/MachineTypeMaster';
import OperatorMaster from './components/OperatorMaster';

import ShiftMaster from './components/ShiftMaster';
import SupplierMaster from './components/SupplierMaster';
import TwineTwistMaster from './components/TwineTwistMaster';
import TwinePlyMaster from './components/TwinePlyMaster';
import PrimaryPlyMaster from './components/PrimaryPlyMaster';
import TwineThreadMaster from './components/TwineThreadMaster';
import TwineStrengthMaster from './components/TwineStrengthMaster';
import YarnDenierMaster from './components/YarnDenierMaster';
import YarnColorMaster from './components/YarnColorMaster';
import YarnTypeMaster from './components/YarnTypeMaster';
import YarnSupplierMaster from './components/YarnSupplierMaster';
import YarnMergeMaster from './components/YarnMergeMaster';
import TwineColorMaster from './components/TwineColorMaster';
import YarnCompositionMaster from './components/YarnCompositionMaster';
import TwineSizeParser from './components/TwineSizeParser';
import WinderSizeParser from './components/WinderSizeParser';
import PrintZoneMaster from './components/PrintZoneMaster';
import CheesePackingGenericMaster from './components/CheesePackingGenericMaster';
import CheeseWinderPairing from './components/CheeseWinderPairing';
import CheeseWinderStatus from './components/CheeseWinderStatus';
import BagSizeSettings from './components/BagSizeSettings';

// New Production Screens
import TFOPrimaryProduction from './pages/TFOPrimaryProduction';
import TFOSecondaryProduction from './pages/TFOSecondaryProduction';
import DoublerPrimaryProduction from './pages/DoublerPrimaryProduction';
import DoublerSecondaryProduction from './pages/DoublerSecondaryProduction';
import ReelingProduction from './pages/ReelingProduction';
import PackingSlipProduction from './pages/PackingSlipProduction';
import BundleEntryProduction from './pages/BundleEntryProduction';
import NettingProduction from './pages/NettingProduction';
import SalesOrder from './pages/SalesOrder';
import SalesDispatch from './pages/SalesDispatch';
import CustomerMaster from './pages/CustomerMaster';
import StockManagement from './pages/StockManagement';

import GateEntry from './components/GateEntry';
import GoodsReceipt from './components/GoodsReceipt';
import TFOWinderPlan from './components/TFOWinderPlan';
import CheesePackingDoubler from './components/CheesePackingDoubler';
import CheesePackingDetails from './components/CheesePackingDetails';
import CheeseBagDetails from './components/CheeseBagDetails';
import CheesePackingReport from './components/CheesePackingReport';
import SecondaryProductionReport from './components/SecondaryProductionReport';
import TFOWinderProductionReport from './components/TFOWinderProductionReport';
import SecondaryReadyReport from './components/SecondaryReadyReport';
import ManagementDashboard from './pages/ManagementDashboard';
import CheeseWinderReport from './components/CheeseWinderReport';

import MasterGroupLanding, { MASTER_GROUPS } from './pages/master/MasterGroupLanding';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

const ProtectedRoute = ({ children, moduleName }) => {
  const { token, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  if (moduleName && !hasPermission(moduleName)) {
    // Redirect to dashboard if no permission
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/entry/gate-entry" element={<ProtectedRoute moduleName="grn-entry"><GateEntry /></ProtectedRoute>} />
            <Route path="/entry/goods-receipt" element={<ProtectedRoute moduleName="grn-entry"><GoodsReceipt /></ProtectedRoute>} />
            <Route path="/quality/tfo-winder-plan" element={<ProtectedRoute><TFOWinderPlan /></ProtectedRoute>} />
            <Route path="/production/tfo-winder" element={<ProtectedRoute><TFOWinderProduction /></ProtectedRoute>} />
            <Route path="/production/cheese-winder-production" element={<ProtectedRoute><CheeseWinderProduction /></ProtectedRoute>} />
            <Route path="/production/doubler-production-primary" element={<ProtectedRoute><DoublerProductionPrimary /></ProtectedRoute>} />

            {/* Cheese Packing Routes */}
            <Route path="/production/capture-doubler-details" element={<ProtectedRoute><CheesePackingDoubler /></ProtectedRoute>} />
            <Route path="/production/cheese-bag-details" element={<ProtectedRoute><CheesePackingDetails /></ProtectedRoute>} />
            <Route path="/reports/active-bags" element={<ProtectedRoute><CheesePackingReport /></ProtectedRoute>} />
            <Route path="/reports/cheese-bag-details" element={<ProtectedRoute><CheeseBagDetails /></ProtectedRoute>} />
            <Route path="/reports/secondary-production" element={<ProtectedRoute><SecondaryProductionReport /></ProtectedRoute>} />
            <Route path="/reports/tfo-winder-production" element={<ProtectedRoute><TFOWinderProductionReport /></ProtectedRoute>} />
            <Route path="/reports/secondary-ready" element={<ProtectedRoute><SecondaryReadyReport /></ProtectedRoute>} />
            <Route path="/reports/cheese-winder-report" element={<ProtectedRoute><CheeseWinderReport /></ProtectedRoute>} />
            <Route path="/reports/management-dashboard" element={<ProtectedRoute><ManagementDashboard /></ProtectedRoute>} />

            {/* Master landing pages (groups) */}
            <Route path="/master/yarn" element={<ProtectedRoute><MasterGroupLanding {...MASTER_GROUPS.yarn} /></ProtectedRoute>} />
            <Route path="/master/twine" element={<ProtectedRoute><MasterGroupLanding {...MASTER_GROUPS.twine} /></ProtectedRoute>} />
            <Route path="/master/cheese-packing" element={<ProtectedRoute><MasterGroupLanding {...MASTER_GROUPS.cheesePacking} /></ProtectedRoute>} />
            <Route path="/master/size" element={<ProtectedRoute><MasterGroupLanding {...MASTER_GROUPS.size} /></ProtectedRoute>} />

            {/* Masters */}
            <Route path="/master/machine-master" element={<ProtectedRoute moduleName="masters-machines"><MachineMaster /></ProtectedRoute>} />
            <Route path="/master/machine-type-master" element={<ProtectedRoute><MachineTypeMaster /></ProtectedRoute>} />
            <Route path="/master/operator-master" element={<ProtectedRoute><OperatorMaster /></ProtectedRoute>} />
            <Route path="/master/cheese-winder-pairing" element={<ProtectedRoute><CheeseWinderPairing /></ProtectedRoute>} />
            <Route path="/reports/cheese-winder-status" element={<ProtectedRoute><CheeseWinderStatus /></ProtectedRoute>} />

            <Route path="/master/shift-master" element={<ProtectedRoute><ShiftMaster /></ProtectedRoute>} />
            <Route path="/master/supplier-master" element={<ProtectedRoute><SupplierMaster /></ProtectedRoute>} />
            <Route path="/master/yarn-denier-master" element={<ProtectedRoute><YarnDenierMaster /></ProtectedRoute>} />
            <Route path="/master/yarn-color-master" element={<ProtectedRoute><YarnColorMaster /></ProtectedRoute>} />
            <Route path="/master/yarn-type-master" element={<ProtectedRoute><YarnTypeMaster /></ProtectedRoute>} />
            <Route path="/master/yarn-supplier-master" element={<ProtectedRoute><YarnSupplierMaster /></ProtectedRoute>} />
            <Route path="/master/yarn-merge-master" element={<ProtectedRoute><YarnMergeMaster /></ProtectedRoute>} />
            <Route path="/master/yarn-composition-master" element={<ProtectedRoute><YarnCompositionMaster /></ProtectedRoute>} />

            {/* Twine Masters */}
            <Route path="/master/twine-twist-master" element={<ProtectedRoute><TwineTwistMaster /></ProtectedRoute>} />
            <Route path="/master/twine-ply-master" element={<ProtectedRoute><TwinePlyMaster /></ProtectedRoute>} />
            <Route path="/master/primary-ply-master" element={<ProtectedRoute><PrimaryPlyMaster /></ProtectedRoute>} />
            <Route path="/master/twine-thread-master" element={<ProtectedRoute><TwineThreadMaster /></ProtectedRoute>} />
            <Route path="/master/twine-strength-master" element={<ProtectedRoute><TwineStrengthMaster /></ProtectedRoute>} />
            <Route path="/master/twine-color-master" element={<ProtectedRoute><TwineColorMaster /></ProtectedRoute>} />
            <Route path="/master/twine-size-parser" element={<ProtectedRoute><TwineSizeParser /></ProtectedRoute>} />
            <Route path="/master/winder-size-parser" element={<ProtectedRoute><WinderSizeParser /></ProtectedRoute>} />
            <Route path="/master/size-settings" element={<ProtectedRoute><BagSizeSettings /></ProtectedRoute>} />
            <Route path="/master/print-zone" element={<ProtectedRoute><PrintZoneMaster /></ProtectedRoute>} />
            <Route path="/master/:masterType" element={<ProtectedRoute><CheesePackingGenericMaster /></ProtectedRoute>} />

            {/* Replaced/New Routes */}
            <Route path="/production/tfo-primary-production" element={<ProtectedRoute><TFOPrimaryProduction /></ProtectedRoute>} />
            <Route path="/production/tfo-secondary-production" element={<ProtectedRoute><TFOSecondaryProduction /></ProtectedRoute>} />
            <Route path="/production/doubler-primary-production" element={<ProtectedRoute><DoublerPrimaryProduction /></ProtectedRoute>} />
            <Route path="/production/doubler-secondary-production" element={<ProtectedRoute><DoublerSecondaryProduction /></ProtectedRoute>} />
            <Route path="/production/reeling-production" element={<ProtectedRoute><ReelingProduction /></ProtectedRoute>} />
            <Route path="/production/packing-slip-production" element={<ProtectedRoute><PackingSlipProduction /></ProtectedRoute>} />
            <Route path="/production/bundle-entry-production" element={<ProtectedRoute><BundleEntryProduction /></ProtectedRoute>} />
            <Route path="/production/netting-production" element={<ProtectedRoute><NettingProduction /></ProtectedRoute>} />
            <Route path="/sales/orders" element={<ProtectedRoute moduleName="sales-entry"><SalesOrder /></ProtectedRoute>} />
            <Route path="/sales/dispatch" element={<ProtectedRoute moduleName="dispatch"><SalesDispatch /></ProtectedRoute>} />
            <Route path="/sales/customer-master" element={<ProtectedRoute><CustomerMaster /></ProtectedRoute>} />
            <Route path="/stock/management" element={<ProtectedRoute moduleName="stores-receipt"><StockManagement /></ProtectedRoute>} />

            {/* Fallback for other routes */}
            <Route path="/production/:moduleName" element={<ProtectedRoute><GenericPage /></ProtectedRoute>} />
            <Route path="/:category/:moduleName" element={<ProtectedRoute><GenericPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
