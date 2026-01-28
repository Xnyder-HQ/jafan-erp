import { useForm } from 'react-hook-form';
import { Filter, Close, Calendar } from '@carbon/icons-react';
import { modalShow, modalHide } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

interface DateRangeFilterProps {
  id: string;
  onFilter: (dateRange: DateRange) => void;
  onClear: () => void;
  isFiltered?: boolean;
}

const DateRangeFilter = ({ id, onFilter, onClear, isFiltered = false }: DateRangeFilterProps) => {
  const modalId = `date-filter-modal-${id}`;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DateRange>();

  const startDate = watch('start_date');
  
  const today = new Date().toISOString().split('T')[0];

  const openModal = () => {
    modalShow(modalId);
  };

  const closeModal = () => {
    modalHide(modalId);
  };

  const onSubmit = (data: DateRange) => {
    onFilter(data);
    closeModal();
  };

  const handleClear = () => {
    reset();
    onClear();
    closeModal();
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
        style={{
          border: isFiltered ? '1px solid var(--primary-600)' : '1px solid var(--neutral-300)',
          color: isFiltered ? 'var(--primary-600)' : 'var(--neutral-700)',
          backgroundColor: isFiltered ? 'var(--primary-50)' : 'transparent',
        }}
      >
        <span className="icon-container">
          <Filter size={16} />
        </span>
        Filter
        {isFiltered && (
          <span
            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-16 xui-h-16 xui-bdr-rad-circle"
            style={{ backgroundColor: 'var(--primary-600)', color: 'white', fontSize: '10px' }}
          >
            1
          </span>
        )}
      </button>

      <section className="xui-modal" xui-modal={modalId}>
        <div className="xui-modal-content xui-max-w-[400px] xui-bdr-rad-[8px]">
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
            <h3 className="xui-font-sz-[18px]">Filter by Date</h3>
            <div
              className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
              onClick={closeModal}
            >
              <Close />
            </div>
          </div>
          <hr className="xui-my-1" />

          <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
            <div className="xui-form-box">
              <label htmlFor={`${id}-start-date`}>
                <span className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <Calendar size={16} />
                  Start Date *
                </span>
              </label>
              <input
                type="date"
                id={`${id}-start-date`}
                max={today}
                {...register('start_date', {
                  required: 'Start date is required',
                })}
              />
              {errors.start_date && (
                <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                  {errors.start_date.message}
                </span>
              )}
            </div>

            <div className="xui-form-box">
              <label htmlFor={`${id}-end-date`}>
                <span className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <Calendar size={16} />
                  End Date *
                </span>
              </label>
              <input
                type="date"
                id={`${id}-end-date`}
                max={today}
                min={startDate}
                {...register('end_date', {
                  required: 'End date is required',
                  validate: (value) => {
                    if (startDate && value < startDate) {
                      return 'End date cannot be before start date';
                    }
                    return true;
                  },
                })}
              />
              {errors.end_date && (
                <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                  {errors.end_date.message}
                </span>
              )}
            </div>

            <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
              <button
                type="button"
                className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="submit"
                className="xui-btn xui-btn-block xui-bdr-rad-[8px]"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                Apply Filter
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default DateRangeFilter;
