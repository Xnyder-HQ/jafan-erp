import { useState } from 'react';
import { Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';

interface DeleteModalProps {
  id: string;
  title: string;
  message: string;
  itemName?: string;
  onDelete: () => Promise<{ success: boolean; message: string }>;
  onSuccess?: () => void;
  setError?: (error: string) => void;
  setSuccessMessage?: (message: string) => void;
  showAlert?: (alertId: string) => void;
}

const DeleteModal = ({
  id,
  title,
  message,
  itemName,
  onDelete,
  onSuccess,
  setError,
  setSuccessMessage,
  showAlert,
}: DeleteModalProps) => {
  const [deleting, setDeleting] = useState(false);

  const closeModal = () => {
    modalHide(id);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await onDelete();

      if (response.success) {
        if (setSuccessMessage) {
          setSuccessMessage(response.message || 'Deleted successfully');
        }
        if (showAlert) {
          showAlert('success-alert');
        }
        closeModal();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        if (setError) {
          setError(response.message || 'Failed to delete');
        }
        if (showAlert) {
          showAlert('error-alert');
        }
      }
    } catch (err: any) {
      if (setError) {
        setError(err.response?.data?.message || 'Failed to delete');
      }
      if (showAlert) {
        showAlert('error-alert');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="xui-modal" xui-modal={id}>
      <div className="xui-modal-content xui-max-w-[400px] xui-bdr-rad-[8px]">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-[18px]">{title}</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={closeModal}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />
        <p className="xui-font-sz-[14px] xui-opacity-8">
          {message}
          {itemName && (
            <span className="xui-font-w-bold"> "{itemName}"</span>
          )}
          ?
        </p>
        <p className="xui-font-sz-[12px] xui-opacity-6 xui-mt-half">
          This action cannot be undone.
        </p>
        <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
          <button
            type="button"
            className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
            onClick={closeModal}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="xui-btn xui-btn-block xui-btn-danger xui-bdr-rad-[8px]"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default DeleteModal;
