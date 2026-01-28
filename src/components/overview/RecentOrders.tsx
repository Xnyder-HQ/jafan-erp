import { ChevronRight } from '@carbon/icons-react';
import { useNavigate } from 'react-router';
import { formatCompactCurrency, formatRelativeTime, getStatusText, getStatusClass } from '../../utils/formatters';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

const RecentOrders = ({ orders }: RecentOrdersProps) => {
  const navigate = useNavigate();

  return (
    <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
      <div className="card-header">
        <h3 className="card-title">Recent Orders</h3>
        <button
          className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-600)',
            fontSize: '13px',
          }}
          onClick={() => navigate('/dashboard/sales/orders')}
        >
          View all
          <span className="icon-container">
            <ChevronRight size={16} />
          </span>
        </button>
      </div>
      <div className="xui-table-responsive">
        <table className="xui-table" xui-style="2">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="xui-text-center xui-py-2">
                  <p style={{ color: 'var(--neutral-500)' }}>No recent orders</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="xui-cursor-pointer"
                  onClick={() => navigate(`/dashboard/sales/orders/${order.id}`)}
                >
                  <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                    {order.orderNumber}
                  </td>
                  <td>{order.customerName}</td>
                  <td>{formatCompactCurrency(order.total)}</td>
                  <td>
                    <span className={`badge ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--neutral-500)' }}>{formatRelativeTime(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
