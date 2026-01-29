import { Routes, Route, Navigate } from 'react-router';
import { DashboardWrapper, AuthWrapper } from './components/layout';
import Protected from './components/Protected';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/dashboard/Index';

import {
  Customers, AddCustomer, EditCustomer,
  Products, AddProduct, EditProduct,
  SalesOrders, AddSalesOrder, EditSalesOrder,
  Invoices, AddInvoice, EditInvoice, AddInvoicePayment,
  BlockCreditors,
  Discounts, AddDiscount, EditDiscount,
  SalesOverview
} from './pages/sales';


import {
  Vendors as ProcurementVendors, AddVendor, EditVendor,
  PurchaseOrders, AddPurchaseOrder, EditPurchaseOrder,
  VendorPayments, AddVendorPayment,
  FuelPurchases, AddFuelPurchase, EditFuelPurchase,
  Expenses as ProcurementExpenses, AddExpense,
  ProcurementOverview
} from './pages/procurement';


import RawMaterials from './pages/inventory/RawMaterials';
import AddRawMaterial from './pages/inventory/AddRawMaterial';
import EditRawMaterial from './pages/inventory/EditRawMaterial';
import FinishedGoods from './pages/inventory/FinishedGoods';
import AddFinishedGood from './pages/inventory/AddFinishedGood';
import EditFinishedGood from './pages/inventory/EditFinishedGood';
import RawMaterialStockLogs from './pages/inventory/RawMaterialStockLogs';
import FinishedGoodStockLogs from './pages/inventory/FinishedGoodStockLogs';
import InventoryOverview from './pages/inventory/Overview';


import ProductionBatches from './pages/production/ProductionBatches';
import AddProductionBatch from './pages/production/AddProductionBatch';
import ProductionTeams from './pages/production/ProductionTeams';
import AddProductionTeam from './pages/production/AddProductionTeam';
import EditProductionTeam from './pages/production/EditProductionTeam';
import QualityControl from './pages/production/QualityControl';
import AddQcLog from './pages/production/AddQcLog';
import StackingLog from './pages/production/StackingLog';
import AddStackingLog from './pages/production/AddStackingLog';
import ProductionFuelLog from './pages/production/FuelLog';
import AddFuelLog from './pages/production/AddFuelLog';
import MachineMaintenance from './pages/production/MachineMaintenance';
import AddMaintenanceLog from './pages/production/AddMaintenanceLog';
import ProductionOverview from './pages/production/Overview';


import DeliveryQueue from './pages/logistics/DeliveryQueue';
import EditDeliveryAssignment from './pages/logistics/EditDeliveryAssignment';
import SupplyLog from './pages/logistics/SupplyLog';
import AddSupplyLog from './pages/logistics/AddSupplyLog';
import FleetManagement from './pages/logistics/FleetManagement';
import LogisticsFuelLog from './pages/logistics/FuelLog';
import AddLogisticsFuelLog from './pages/logistics/AddLogisticsFuelLog';
import LogisticsOverview from './pages/logistics/Overview';


import { AllUsers, AddUser, EditUser, Machines, AddMachine, EditMachine, AllVehicles, AddVehicle, EditVehicle, AllBusinessRules, AddBusinessRule, EditBusinessRule, AdministrationOverview } from './pages/users';


import { AllRoles, AddRole, EditRole, RoleAcls, AddRoleAcl, AddMultipleRoleAcls, EditRoleAcl, RolesOverview } from './pages/roles';


import { AllAcls, AddAcl, AddMultipleAcls, EditAcl, AclOverview } from './pages/acls';


import { AllApprovals, AddApproval, ApprovalsOverview } from './pages/approvals';


import { AllLogs, LogsOverview } from './pages/logs';

import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route element={<Protected requireAuth={false} />}>
        <Route element={<AuthWrapper />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Route>

      <Route element={<Protected requireAuth={true} />}>
        <Route path="/dashboard" element={<DashboardWrapper />}>
        <Route index element={<Dashboard />} />

        <Route path="sales">
          <Route index element={<Navigate to="customers" replace />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/add" element={<AddCustomer />} />
          <Route path="customers/edit/:id" element={<EditCustomer />} />
          <Route path="products" element={<Products />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:id" element={<EditProduct />} />
          <Route path="orders" element={<SalesOrders />} />
          <Route path="orders/add" element={<AddSalesOrder />} />
          <Route path="orders/edit/:id" element={<EditSalesOrder />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/add" element={<AddInvoice />} />
          <Route path="invoices/edit/:id" element={<EditInvoice />} />
          <Route path="invoices/:invoiceId/payment/add" element={<AddInvoicePayment />} />
          <Route path="discounts" element={<Discounts />} />
          <Route path="discounts/add" element={<AddDiscount />} />
          <Route path="discounts/edit/:id" element={<EditDiscount />} />
          <Route path="creditors" element={<BlockCreditors />} />
          <Route path="overview" element={<SalesOverview />} />
        </Route>

        <Route path="procurement">
          <Route index element={<Navigate to="vendors" replace />} />
          <Route path="vendors" element={<ProcurementVendors />} />
          <Route path="vendors/add" element={<AddVendor />} />
          <Route path="vendors/edit/:id" element={<EditVendor />} />
          <Route path="orders" element={<PurchaseOrders />} />
          <Route path="orders/add" element={<AddPurchaseOrder />} />
          <Route path="orders/edit/:id" element={<EditPurchaseOrder />} />
          <Route path="payments" element={<VendorPayments />} />
          <Route path="payments/add" element={<AddVendorPayment />} />
          <Route path="fuel" element={<FuelPurchases />} />
          <Route path="fuel/add" element={<AddFuelPurchase />} />
          <Route path="fuel/edit/:id" element={<EditFuelPurchase />} />
          <Route path="expenses" element={<ProcurementExpenses />} />
          <Route path="expenses/add" element={<AddExpense />} />
          <Route path="overview" element={<ProcurementOverview />} />
        </Route>

        <Route path="inventory">
          <Route index element={<Navigate to="raw-materials" replace />} />
          <Route path="raw-materials" element={<RawMaterials />} />
          <Route path="raw-materials/add" element={<AddRawMaterial />} />
          <Route path="raw-materials/edit/:id" element={<EditRawMaterial />} />
          <Route path="raw-material-logs" element={<RawMaterialStockLogs />} />
          <Route path="finished-goods" element={<FinishedGoods />} />
          <Route path="finished-goods/add" element={<AddFinishedGood />} />
          <Route path="finished-goods/edit/:id" element={<EditFinishedGood />} />
          <Route path="finished-goods-logs" element={<FinishedGoodStockLogs />} />
          <Route path="overview" element={<InventoryOverview />} />
        </Route>

        <Route path="production">
          <Route index element={<Navigate to="daily" replace />} />
          <Route path="daily" element={<ProductionBatches />} />
          <Route path="daily/add" element={<AddProductionBatch />} />
          <Route path="teams" element={<ProductionTeams />} />
          <Route path="teams/add" element={<AddProductionTeam />} />
          <Route path="teams/edit/:id" element={<EditProductionTeam />} />
          <Route path="qc" element={<QualityControl />} />
          <Route path="qc/add" element={<AddQcLog />} />
          <Route path="stacking" element={<StackingLog />} />
          <Route path="stacking/add" element={<AddStackingLog />} />
          <Route path="fuel" element={<ProductionFuelLog />} />
          <Route path="fuel/add" element={<AddFuelLog />} />
          <Route path="maintenance" element={<MachineMaintenance />} />
          <Route path="maintenance/add" element={<AddMaintenanceLog />} />
          <Route path="overview" element={<ProductionOverview />} />
        </Route>

        <Route path="logistics">
          <Route index element={<Navigate to="queue" replace />} />
          <Route path="queue" element={<DeliveryQueue />} />
          <Route path="queue/edit/:id" element={<EditDeliveryAssignment />} />
          <Route path="supply-log" element={<SupplyLog />} />
          <Route path="supply-log/add" element={<AddSupplyLog />} />
          <Route path="fleet" element={<FleetManagement />} />
          <Route path="fuel" element={<LogisticsFuelLog />} />
          <Route path="fuel/add" element={<AddLogisticsFuelLog />} />
          <Route path="overview" element={<LogisticsOverview />} />
        </Route>

        <Route path="users">
          <Route index element={<AllUsers />} />
          <Route path="add" element={<AddUser />} />
          <Route path="edit/:id" element={<EditUser />} />
          <Route path="machines" element={<Machines />} />
          <Route path="machines/add" element={<AddMachine />} />
          <Route path="machines/edit/:id" element={<EditMachine />} />
          <Route path="vehicles" element={<AllVehicles />} />
          <Route path="vehicles/add" element={<AddVehicle />} />
          <Route path="vehicles/edit/:id" element={<EditVehicle />} />
          <Route path="rules" element={<AllBusinessRules />} />
          <Route path="rules/add" element={<AddBusinessRule />} />
          <Route path="rules/edit/:id" element={<EditBusinessRule />} />
          <Route path="overview" element={<AdministrationOverview />} />
        </Route>

        <Route path="roles">
          <Route index element={<AllRoles />} />
          <Route path="add" element={<AddRole />} />
          <Route path="edit/:id" element={<EditRole />} />
          <Route path="acls" element={<RoleAcls />} />
          <Route path="acls/add" element={<AddRoleAcl />} />
          <Route path="acls/add-multiple" element={<AddMultipleRoleAcls />} />
          <Route path="acls/edit/:id" element={<EditRoleAcl />} />
          <Route path="overview" element={<RolesOverview />} />
        </Route>

        <Route path="acls">
          <Route index element={<AllAcls />} />
          <Route path="add" element={<AddAcl />} />
          <Route path="add-multiple" element={<AddMultipleAcls />} />
          <Route path="edit/:id" element={<EditAcl />} />
          <Route path="overview" element={<AclOverview />} />
        </Route>

        <Route path="approvals">
          <Route index element={<AllApprovals />} />
          <Route path="add" element={<AddApproval />} />
          <Route path="overview" element={<ApprovalsOverview />} />
        </Route>

        <Route path="logs">
          <Route index element={<AllLogs />} />
          <Route path="overview" element={<LogsOverview />} />
        </Route>

        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
