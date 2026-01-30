import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import deliveryAssignmentsService from '../../services/deliveryAssignments.service';
import type { DeliveryAssignment } from '../../services/deliveryAssignments.service';
import vehiclesService, { type Vehicle } from '../../services/vehicles.service';
import { Alert, showAlert } from '../../components/common';
import { ConfirmModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';

interface DeliveryAssignmentFormData {
  scheduled_date: string;
  vehicle_unique_id: string;
  notes: string;
}

const EditDeliveryAssignment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalAssignment, setOriginalAssignment] = useState<DeliveryAssignment | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const accessIds = getAccessIds('logistics-supply-chain', 'delivery-assignments');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeliveryAssignmentFormData>({
    defaultValues: {
      scheduled_date: '',
      vehicle_unique_id: '',
      notes: '',
    },
  });

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await vehiclesService.getVehiclesForDropdown();

      if (response.success && response.data && 'rows' in response.data) {
        setVehicles(response.data.rows);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  }, []);

  useEffect(() => {
    if (!moduleId || !id) {
      setFetching(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [assignmentRes] = await Promise.all([
          deliveryAssignmentsService.getDeliveryAssignment(id, {
            module_unique_id: moduleId,
            sub_module_unique_id: subModuleId,
          }),
          fetchVehicles(),
        ]);

        if (assignmentRes.success && assignmentRes.data) {
          const assignment = assignmentRes.data;
          setOriginalAssignment(assignment);
          reset({
            scheduled_date: assignment.scheduled_date || '',
            vehicle_unique_id: assignment.vehicle_unique_id || '',
            notes: assignment.notes || '',
          });
        } else {
          setError('Delivery assignment not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to load delivery assignment'));
        showAlert('error-alert');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [moduleId, subModuleId, id, reset, fetchVehicles]);

  const isPending = originalAssignment?.assignment_status?.toLowerCase() === 'pending';

  const onSubmit = async (data: DeliveryAssignmentFormData) => {
    if (!moduleId || !subModuleId || !id || !originalAssignment) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    if (!isPending) {
      setError('Only pending delivery assignments can be edited');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      };

      const updatePromises: Promise<any>[] = [];

      if (data.scheduled_date !== originalAssignment.scheduled_date) {
        updatePromises.push(
          deliveryAssignmentsService.updateScheduledDate(id, { scheduled_date: data.scheduled_date }, params)
        );
      }

      const originalVehicle = originalAssignment.vehicle_unique_id || '';
      if (data.vehicle_unique_id && data.vehicle_unique_id !== originalVehicle) {
        updatePromises.push(
          deliveryAssignmentsService.reassignDeliveryAssignment(id, { vehicle_unique_id: data.vehicle_unique_id }, params)
        );
      }

      const originalNotes = originalAssignment.notes || '';
      if (data.notes !== originalNotes) {
        updatePromises.push(
          deliveryAssignmentsService.updateNotes(id, { notes: data.notes }, params)
        );
      }

      if (updatePromises.length === 0) {
        setError('No changes detected');
        showAlert('error-alert');
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled(updatePromises);
      const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

      if (failures.length === results.length) {
        throw failures[0]?.reason || new Error('Failed to update delivery assignment');
      }

      if (failures.length > 0) {
        setSuccessMessage('Delivery assignment partially updated. Some changes may not have been saved.');
      } else {
        setSuccessMessage('Delivery assignment updated successfully');
      }
      showAlert('success-alert');
      setTimeout(() => {
        navigate('/dashboard/logistics/queue');
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update delivery assignment'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!moduleId || !subModuleId || !id) {
      return { success: false, message: 'Unable to start delivery' };
    }
    return deliveryAssignmentsService.startDeliveryAssignment(id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleCompleteDelivery = async () => {
    if (!moduleId || !subModuleId || !id) {
      return { success: false, message: 'Unable to complete delivery' };
    }
    return deliveryAssignmentsService.completeDeliveryAssignment(id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleCancelDelivery = async () => {
    if (!moduleId || !subModuleId || !id) {
      return { success: false, message: 'Unable to cancel delivery' };
    }
    return deliveryAssignmentsService.cancelDeliveryAssignment(id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleDeleteDelivery = async () => {
    if (!moduleId || !subModuleId || !id) {
      return { success: false, message: 'Unable to delete delivery assignment' };
    }
    return deliveryAssignmentsService.deleteDeliveryAssignment(id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handleActionSuccess = () => {
    navigate('/dashboard/logistics/queue');
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="xui-badge xui-badge-warning">Pending</span>;
      case 'in transit':
        return <span className="xui-badge xui-badge-info">In Transit</span>;
      case 'completed':
        return <span className="xui-badge xui-badge-success">Completed</span>;
      case 'cancelled':
        return <span className="xui-badge xui-badge-danger">Cancelled</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  if (fetching) {
    return (
      <div>
        <Navbar title="Edit Delivery Assignment" subtitle="Update delivery assignment details" />
        <div className="xui-py-1">
          <p>Loading delivery assignment...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Delivery Assignment" subtitle="Update delivery assignment details" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {originalAssignment && (
          <div className="xui-bg-white xui-bdr-rad-half xui-p-1 xui-mb-1-half" style={{ border: '1px solid var(--neutral-200)' }}>
            <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1">
              <div>
                <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Order Reference</p>
                <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <p className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>{originalAssignment.SalesOrder?.reference || 'N/A'}</p>
                  {originalAssignment.SalesOrder?.unique_id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/sales/orders/edit/${originalAssignment.SalesOrder?.unique_id}`)}
                      className="xui-btn xui-font-sz-70 xui-py-half xui-px-half xui-bdr-rad-half"
                      style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)', border: 'none' }}
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Amount Payable</p>
                <p className="xui-font-w-500">{originalAssignment.SalesOrder ? formatCurrency(originalAssignment.SalesOrder.amount_payable) : 'N/A'}</p>
              </div>
              <div>
                <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Items</p>
                <p className="xui-font-w-500">{originalAssignment.SalesOrder ? `${originalAssignment.SalesOrder.total_items_dropped}/${originalAssignment.SalesOrder.total_items_ordered} dropped` : 'N/A'}</p>
              </div>
              <div>
                <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Status</p>
                {getStatusBadge(originalAssignment.assignment_status)}
              </div>
              {originalAssignment.auto_assigned && (
                <div>
                  <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Assignment Type</p>
                  <span className="xui-badge xui-badge-blue">Auto-assigned</span>
                </div>
              )}
              {originalAssignment.started_at && (
                <div>
                  <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Started At</p>
                  <p className="xui-font-sz-90">{formatDate(originalAssignment.started_at)}</p>
                </div>
              )}
              {originalAssignment.completed_at && (
                <div>
                  <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Completed At</p>
                  <p className="xui-font-sz-90">{formatDate(originalAssignment.completed_at)}</p>
                </div>
              )}
              {originalAssignment.SalesOrder?.outside_town && (
                <div>
                  <p className="xui-font-sz-80 xui-opacity-5 xui-mb-half">Outside Town</p>
                  <p className="xui-font-sz-90">{originalAssignment.SalesOrder.outside_town_location || 'Yes'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isPending && originalAssignment && (
          <div className="xui-p-1 xui-mb-1-half xui-bdr-rad-half" style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }}>
            <p className="xui-font-sz-90">This delivery assignment is <strong>{originalAssignment.assignment_status}</strong> and cannot be edited. Only pending assignments can be modified.</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="scheduled_date">Scheduled Date *</label>
                <input
                  type="date"
                  id="scheduled_date"
                  disabled={!isPending}
                  {...register('scheduled_date', { required: 'Scheduled date is required' })}
                />
                {errors.scheduled_date && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.scheduled_date.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="vehicle_unique_id">Assigned Vehicle</label>
                <select
                  id="vehicle_unique_id"
                  disabled={!isPending}
                  {...register('vehicle_unique_id')}
                >
                  <option value="">--No vehicle assigned ({vehicles.filter(v => v.is_active && v.availability_status === 'Available').length} available)--</option>
                  {vehicles.map((vehicle) => {
                    const isAvailable = vehicle.is_active && (vehicle.availability_status === 'Available' || vehicle.unique_id === originalAssignment?.vehicle_unique_id);
                    const statusLabel = !vehicle.is_active ? '[Inactive]' : vehicle.availability_status !== 'Available' ? `[${vehicle.availability_status}]` : '';
                    return (
                      <option
                        key={vehicle.unique_id}
                        value={vehicle.unique_id}
                        disabled={!isAvailable}
                      >
                        {vehicle.plate_number} - {vehicle.type} ({vehicle.capacity_value} {vehicle.capacity_unit}) {statusLabel}
                      </option>
                    );
                  })}
                </select>
                <small className="xui-opacity-5 xui-d-block xui-mt-half">
                  Unavailable vehicles are shown but disabled. The currently assigned vehicle is always selectable.
                </small>
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Delivery notes (optional)"
                  rows={5}
                  disabled={!isPending}
                  {...register('notes', {
                    minLength: { value: 2, message: 'Notes must be at least 2 characters' },
                    maxLength: { value: 65535, message: 'Notes must be less than 65535 characters' },
                  })}
                />
                {errors.notes && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.notes.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mt-1">
            {isPending && (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="xui-btn xui-bdr-rad-[4px]"
                  style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => modalShow('start-delivery-modal')}
                  className="xui-btn xui-bdr-rad-[4px]"
                  style={{ backgroundColor: 'var(--info)', color: '#fff' }}
                >
                  Start Delivery
                </button>
                <button
                  type="button"
                  onClick={() => modalShow('cancel-delivery-modal')}
                  className="xui-btn xui-bdr-rad-[4px]"
                  style={{ backgroundColor: 'var(--error)', color: '#fff' }}
                >
                  Cancel Delivery
                </button>
                <button
                  type="button"
                  onClick={() => modalShow('delete-delivery-modal')}
                  className="xui-btn xui-btn-text xui-bdr-rad-[4px]"
                  style={{ border: '1px solid var(--error)', color: 'var(--error)' }}
                >
                  Delete
                </button>
              </>
            )}

            {originalAssignment?.assignment_status?.toLowerCase() === 'in transit' && (
              <button
                type="button"
                onClick={() => modalShow('complete-delivery-modal')}
                className="xui-btn xui-bdr-rad-[4px]"
                style={{ backgroundColor: 'var(--success)', color: '#fff' }}
              >
                Mark as Completed
              </button>
            )}
          </div>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ConfirmModal
        id="start-delivery-modal"
        title="Start Delivery"
        message="Are you sure you want to mark this delivery as in transit"
        itemName={originalAssignment?.SalesOrder?.reference}
        confirmText="Start"
        confirmingText="Starting..."
        confirmButtonStyle="primary"
        onConfirm={handleStartDelivery}
        onSuccess={handleActionSuccess}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="complete-delivery-modal"
        title="Complete Delivery"
        message="Are you sure you want to mark this delivery as completed"
        itemName={originalAssignment?.SalesOrder?.reference}
        confirmText="Complete"
        confirmingText="Completing..."
        confirmButtonStyle="success"
        onConfirm={handleCompleteDelivery}
        onSuccess={handleActionSuccess}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="cancel-delivery-modal"
        title="Cancel Delivery"
        message="Are you sure you want to cancel this delivery assignment"
        itemName={originalAssignment?.SalesOrder?.reference}
        confirmText="Cancel Delivery"
        confirmingText="Cancelling..."
        confirmButtonStyle="danger"
        onConfirm={handleCancelDelivery}
        onSuccess={handleActionSuccess}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ConfirmModal
        id="delete-delivery-modal"
        title="Delete Delivery Assignment"
        message="Are you sure you want to permanently delete this delivery assignment? This action cannot be undone"
        itemName={originalAssignment?.SalesOrder?.reference}
        confirmText="Delete"
        confirmingText="Deleting..."
        confirmButtonStyle="danger"
        onConfirm={handleDeleteDelivery}
        onSuccess={handleActionSuccess}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default EditDeliveryAssignment;
