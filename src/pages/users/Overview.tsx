import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Renew, UserMultiple, DeliveryTruck, Settings } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { AdministrationStats } from '../../services/analytics.service';
import { extractErrorMessage } from '../../utils/formatters';

const AdministrationOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<AdministrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('administration', 'administration-overview');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const fetchStats = useCallback(async () => {
    if (!moduleId) {
      setError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await analyticsService.getAdministrationStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load administration stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load administration stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="Administration Overview" subtitle="Administration module analytics" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading administration analytics...</p>
          </div>
        ) : error ? (
          <div className="xui-py-3 xui-text-center">
            <p className="xui-opacity-6 xui-mb-1">{error}</p>
            <button
              onClick={fetchStats}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
            >
              <span className="icon-container"><Renew size={16} /></span>
              Retry
            </button>
          </div>
        ) : stats ? (
          <>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
              <MetricCard
                title="Total Users"
                value={stats.total_users}
                icon={<UserMultiple size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Total Vehicles"
                value={stats.total_vehicles}
                icon={<DeliveryTruck size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Total Machines"
                value={stats.total_machines}
                icon={<Settings size={24} />}
                iconBgColor="var(--success-light)"
                iconColor="var(--success)"
              />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Users by Role</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_users_via_role.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_users_via_role.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_users_via_role.map((item) => item.Role?.name || 'Unknown'),
                        colors: ['#4361ee', '#06d6a0', '#fca311', '#f72585', '#8338ec', '#3a86ff'],
                        legend: { position: 'bottom', fontSize: '12px' },
                        dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                        plotOptions: { pie: { donut: { size: '55%' } } },
                      }}
                    />
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Vehicles by Type</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_vehicle_via_type.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_vehicle_via_type.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_vehicle_via_type.map((item) => item.type),
                        colors: ['#f59e0b', '#3b82f6', '#8338ec', '#06d6a0'],
                        legend: { position: 'bottom', fontSize: '12px' },
                        dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                        plotOptions: { pie: { donut: { size: '55%' } } },
                      }}
                    />
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Vehicle Availability</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_vehicle_via_availability_status.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_vehicle_via_availability_status.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_vehicle_via_availability_status.map((item) => item.availability_status),
                        colors: ['#06d6a0', '#4361ee', '#fca311', '#f72585'],
                        legend: { position: 'bottom', fontSize: '12px' },
                        dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                        plotOptions: { pie: { donut: { size: '55%' } } },
                      }}
                    />
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Vehicles by Fuel Type</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    {stats.total_vehicle_via_fuel_type.length > 0 ? (
                      stats.total_vehicle_via_fuel_type.map((item, idx) => (
                        <div key={idx} className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                          <span className="xui-font-sz-85 xui-opacity-6">{item.fuel_type}</span>
                          <span className="xui-font-sz-85 xui-font-w-600">{item.total_count.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                    )}
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center" style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '8px' }}>
                      <span className="xui-font-sz-85 xui-opacity-6">Active Vehicles</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--success)' }}>
                        {stats.total_vehicle_via_is_active.find((i) => i.is_active)?.total_count ?? 0}
                      </span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Inactive Vehicles</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--error)' }}>
                        {stats.total_vehicle_via_is_active.find((i) => !i.is_active)?.total_count ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Machine Summary</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    {stats.total_machine_via_type.length > 0 ? (
                      stats.total_machine_via_type.map((item, idx) => (
                        <div key={idx} className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                          <span className="xui-font-sz-85 xui-opacity-6">{item.type}</span>
                          <span className="xui-font-sz-85 xui-font-w-600">{item.total_count.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                    )}
                    {stats.total_machine_via_fuel_type.length > 0 && (
                      <>
                        <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '8px' }}>
                          <p className="xui-font-sz-80 xui-opacity-4 xui-mb-half">By Fuel Type</p>
                        </div>
                        {stats.total_machine_via_fuel_type.map((item, idx) => (
                          <div key={idx} className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                            <span className="xui-font-sz-85 xui-opacity-6">{item.fuel_type}</span>
                            <span className="xui-font-sz-85 xui-font-w-600">{item.total_count.toLocaleString()}</span>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center" style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '8px' }}>
                      <span className="xui-font-sz-85 xui-opacity-6">Active Machines</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--success)' }}>
                        {stats.total_machine_via_is_active.find((i) => i.is_active)?.total_count ?? 0}
                      </span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Inactive Machines</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--error)' }}>
                        {stats.total_machine_via_is_active.find((i) => !i.is_active)?.total_count ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Users by Role</h3>
              </div>
              <div className="xui-table-responsive">
                <table className="xui-table" xui-style="2">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.total_users_via_role.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td className="xui-font-w-500">{item.Role?.name || 'Unknown'}</td>
                        <td className="xui-font-w-600">{item.total_count.toLocaleString()}</td>
                      </tr>
                    ))}
                    {stats.total_users_via_role.length === 0 && (
                      <tr>
                        <td colSpan={2} className="xui-text-center xui-py-2">
                          <p className="xui-opacity-5">No data</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdministrationOverview;
