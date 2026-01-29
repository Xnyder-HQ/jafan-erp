import { useState } from 'react';
import { Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import { extractErrorMessage } from '../../utils/formatters';

interface ConfirmModalProps {
  id: string;
  title: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  confirmingText?: string;
  confirmButtonStyle?: 'primary' | 'success' | 'warning' | 'danger';
  onConfirm: () => Promise<{ success: boolean; message: string }>;
  onSuccess?: () => void;
  setError?: (error: string) => void;
  setSuccessMessage?: (message: string) => void;
  showAlert?: (alertId: string) => void;
}

const ConfirmModal = ({
  id,
  title,
  message,
  itemName,
  confirmText = 'Confirm',
  confirmingText = 'Processing...',
  confirmButtonStyle = 'primary',
  onConfirm,
  onSuccess,
  setError,
  setSuccessMessage,
  showAlert,
}: ConfirmModalProps) => {
  const [processing, setProcessing] = useState(false);

  const closeModal = () => {
    modalHide(id);
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const response = await onConfirm();

      if (response.success) {
        if (setSuccessMessage) {
          setSuccessMessage(response.message || 'Action completed successfully');
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
          setError(response.message || 'Action failed');
        }
        if (showAlert) {
          showAlert('error-alert');
        }
      }
    } catch (err: any) {
      if (setError) {
        setError(extractErrorMessage(err, 'Action failed'));
      }
      if (showAlert) {
        showAlert('error-alert');
      }
    } finally {
      setProcessing(false);
    }
  };

  const getButtonClass = () => {
    switch (confirmButtonStyle) {
      case 'success':
        return 'xui-btn xui-btn-block xui-bdr-rad-half';
      case 'warning':
        return 'xui-btn xui-btn-block xui-btn-warning xui-bdr-rad-half';
      case 'danger':
        return 'xui-btn xui-btn-block xui-btn-danger xui-bdr-rad-half';
      case 'primary':
      default:
        return 'xui-btn xui-btn-block xui-bdr-rad-half';
    }
  };

  const getButtonStyle = () => {
    if (confirmButtonStyle === 'success') {
      return { backgroundColor: 'var(--success)', color: '#fff' };
    }
    if (confirmButtonStyle === 'primary') {
      return { backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' };
    }
    return {};
  };

  return (
    <section className="xui-modal" xui-modal={id}>
      <div className="xui-modal-content xui-max-w-[400px] xui-bdr-rad-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-90">{title}</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-half xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={closeModal}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />
        <p className="xui-font-sz-85 xui-opacity-8">
          {message}
          {itemName && (
            <span className="xui-font-w-bold"> "{itemName}"</span>
          )}
          ?
        </p>
        <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
          <button
            type="button"
            className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-half"
            onClick={closeModal}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            className={getButtonClass()}
            style={getButtonStyle()}
            onClick={handleConfirm}
            disabled={processing}
          >
            {processing ? confirmingText : confirmText}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ConfirmModal;
