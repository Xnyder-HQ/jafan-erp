import { Navbar } from '../../components/layout';
import { Add, Edit, DeliveryTruck } from '@carbon/icons-react';

const FleetManagement = () => {
  const vehicles = [
    { id: '1', regNumber: 'ABC-123-XY', type: 'Block Truck', capacity: '800 blocks', fuelType: 'Diesel', benchmark: 30, expectedTrips: 8, status: 'available', driver: 'Musa Ibrahim' },
    { id: '2', regNumber: 'DEF-456-XY', type: 'Block Truck', capacity: '600 blocks', fuelType: 'Diesel', benchmark: 25, expectedTrips: 7, status: 'on_delivery', driver: 'Ahmed Yusuf' },
    { id: '3', regNumber: 'GHI-789-XY', type: 'Tipper', capacity: '10-ton', fuelType: 'Diesel', benchmark: 40, expectedTrips: 5, status: 'down_for_maintenance', driver: null },
    { id: '4', regNumber: 'JKL-012-XY', type: 'Water Tanker', capacity: '3000L', fuelType: 'Petrol', benchmark: 20, expectedTrips: 10, status: 'available', driver: 'Sani Abubakar' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return 'xui-badge-success';
      case 'on_delivery': return 'xui-badge-info';
      case 'down_for_maintenance': return 'xui-badge-danger';
      default: return 'xui-badge-default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'on_delivery': return 'On Delivery';
      case 'down_for_maintenance': return 'Maintenance';
      default: return status;
    }
  };

  return (
    <div>
      <Navbar title="Fleet Management" subtitle="Manage vehicles and assignments" />
      <div className="xui-py-1">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-flex-end xui-mb-1">
          <button className="xui-btn xui-bdr-rad-[4px] xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
            <span className="icon-container"><Add size={16} /></span><span>Add Vehicle</span>
          </button>
        </div>

        <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="xui-bdr-rad-[8px] xui-bdr-fade xui-bdr-w-1 xui-bdr-style-solid xui-p-1">
              <div className="xui-d-flex xui-flex-ai-start xui-flex-jc-space-between xui-mb-1">
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
                  <div className="xui-w-48 xui-h-48 xui-bdr-rad-[8px] xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ backgroundColor: 'var(--primary-100)' }}>
                    <span className="icon-container" style={{ color: 'var(--primary-700)' }}><DeliveryTruck size={24} /></span>
                  </div>
                  <div>
                    <p className="xui-font-sz-[16px] xui-font-w-bold">{vehicle.regNumber}</p>
                    <p className="xui-font-sz-[13px] xui-opacity-6">{vehicle.type}</p>
                  </div>
                </div>
                <span className={`xui-badge ${getStatusBadge(vehicle.status)}`}>{getStatusText(vehicle.status)}</span>
              </div>
              <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1 xui-mb-1">
                <div><p className="xui-font-sz-[12px] xui-opacity-4">Capacity</p><p className="xui-font-sz-[14px] xui-font-w-500">{vehicle.capacity}</p></div>
                <div><p className="xui-font-sz-[12px] xui-opacity-4">Fuel Type</p><p className="xui-font-sz-[14px] xui-font-w-500">{vehicle.fuelType}</p></div>
                <div><p className="xui-font-sz-[12px] xui-opacity-4">Benchmark</p><p className="xui-font-sz-[14px] xui-font-w-500">{vehicle.benchmark}L</p></div>
                <div><p className="xui-font-sz-[12px] xui-opacity-4">Expected Trips</p><p className="xui-font-sz-[14px] xui-font-w-500">{vehicle.expectedTrips}</p></div>
              </div>
              <div className="xui-bdr-t-fade xui-bdr-t-w-1 xui-bdr-t-style-solid xui-pt-1">
                <p className="xui-font-sz-[12px] xui-opacity-4">Assigned Driver</p>
                <p className="xui-font-sz-[14px] xui-font-w-500">{vehicle.driver || <span className="xui-opacity-4">Unassigned</span>}</p>
              </div>
              <button className="xui-btn xui-btn-default xui-btn-block xui-bdr-rad-[4px] xui-mt-1 xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-grid-gap-half">
                <span className="icon-container"><Edit size={16} /></span><span>Edit Vehicle</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FleetManagement;
