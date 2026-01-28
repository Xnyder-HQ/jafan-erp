import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Close, DocumentExport, DocumentPdf, Table } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ExportFormat = 'excel' | 'csv' | 'pdf';

interface ExportFormData {
  format: ExportFormat;
}

interface Column {
  key: string;
  header: string;
}

interface ExportModalProps {
  id: string;
  title?: string;
  fileName: string;
  columns: Column[];
  data: Record<string, any>[];
  onSuccess?: () => void;
  setSuccessMessage?: (message: string) => void;
  showAlert?: (alertId: string) => void;
}

const ExportModal = ({
  id,
  title = 'Export Data',
  fileName,
  columns,
  data,
  onSuccess,
  setSuccessMessage,
  showAlert,
}: ExportModalProps) => {
  const [exporting, setExporting] = useState(false);

  const { register, handleSubmit, watch } = useForm<ExportFormData>({
    defaultValues: {
      format: 'excel',
    },
  });

  const selectedFormat = watch('format');

  const closeModal = () => {
    modalHide(id);
  };

  const prepareData = () => {
    return data.map((row) => {
      const exportRow: Record<string, any> = {};
      columns.forEach((col) => {
        const keys = col.key.split('.');
        let value: any = row;
        for (const key of keys) {
          value = value?.[key];
        }
        exportRow[col.header] = value ?? 'N/A';
      });
      return exportRow;
    });
  };

  const exportToExcel = () => {
    const exportData = prepareData();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
  };

  const exportToCSV = () => {
    const exportData = prepareData();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(title, 14, 15);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableHeaders = columns.map((col) => col.header);
    const tableData = data.map((row) => {
      return columns.map((col) => {
        const keys = col.key.split('.');
        let value: any = row;
        for (const key of keys) {
          value = value?.[key];
        }
        return value ?? 'N/A';
      });
    });

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    doc.save(`${fileName}.pdf`);
  };

  const onSubmit = async (formData: ExportFormData) => {
    if (data.length === 0) {
      return;
    }

    setExporting(true);
    try {
      switch (formData.format) {
        case 'excel':
          exportToExcel();
          break;
        case 'csv':
          exportToCSV();
          break;
        case 'pdf':
          exportToPDF();
          break;
      }

      if (setSuccessMessage) {
        setSuccessMessage(`Data exported successfully as ${formData.format.toUpperCase()}`);
      }
      if (showAlert) {
        showAlert('success-alert');
      }
      closeModal();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatOptions = [
    {
      value: 'excel',
      label: 'Excel (.xlsx)',
      description: 'Best for spreadsheet applications',
      icon: <Table size={20} />,
    },
    {
      value: 'csv',
      label: 'CSV (.csv)',
      description: 'Universal format for data import',
      icon: <DocumentExport size={20} />,
    },
    {
      value: 'pdf',
      label: 'PDF (.pdf)',
      description: 'Best for printing and sharing',
      icon: <DocumentPdf size={20} />,
    },
  ];

  return (
    <section className="xui-modal" xui-modal={id}>
      <div className="xui-modal-content xui-max-w-[450px] xui-bdr-rad-[8px]">
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

        {data.length === 0 ? (
          <div className="xui-py-2 xui-text-center">
            <p className="xui-font-sz-[14px] xui-opacity-7">No data available to export.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <p className="xui-font-sz-[14px] xui-opacity-8 xui-mb-1">
              Select the format you want to export {data.length} record{data.length !== 1 ? 's' : ''} to:
            </p>

            <div className="xui-d-grid xui-grid-gap-half">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-p-1 xui-bdr-rad-half xui-cursor-pointer"
                  style={{
                    border: selectedFormat === option.value
                      ? '2px solid var(--primary-600)'
                      : '1px solid var(--neutral-200)',
                    backgroundColor: selectedFormat === option.value
                      ? 'var(--primary-50)'
                      : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...register('format')}
                    className="xui-d-none"
                  />
                  <div
                    className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-40 xui-h-40 xui-bdr-rad-half"
                    style={{
                      backgroundColor: selectedFormat === option.value
                        ? 'var(--primary-600)'
                        : 'var(--neutral-100)',
                      color: selectedFormat === option.value
                        ? 'white'
                        : 'var(--neutral-600)',
                    }}
                  >
                    {option.icon}
                  </div>
                  <div className="xui-flex-1">
                    <p className="xui-font-sz-[14px] xui-font-w-500">{option.label}</p>
                    <p className="xui-font-sz-[12px] xui-opacity-6">{option.description}</p>
                  </div>
                  <div
                    className="xui-w-20 xui-h-20 xui-bdr-rad-circle xui-d-flex xui-flex-ai-center xui-flex-jc-center"
                    style={{
                      border: selectedFormat === option.value
                        ? '6px solid var(--primary-600)'
                        : '2px solid var(--neutral-300)',
                      backgroundColor: 'white',
                    }}
                  />
                </label>
              ))}
            </div>

            <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
              <button
                type="button"
                className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
                onClick={closeModal}
                disabled={exporting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="xui-btn xui-btn-block xui-bdr-rad-[8px]"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
                disabled={exporting || data.length === 0}
              >
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default ExportModal;
