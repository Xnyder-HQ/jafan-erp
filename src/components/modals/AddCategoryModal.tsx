import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import categoriesService from '../../services/categories.service';
import { showAlert } from '../common';
import { extractErrorMessage } from '../../utils/formatters';

interface AddCategoryFormData {
  name: string;
}

interface AddCategoryModalProps {
  accessIds: { module_unique_id: string; sub_module_unique_id: string } | null;
  onSuccess: (categoryId?: string) => void;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
}

const AddCategoryModal = ({ accessIds, onSuccess, setError, setSuccessMessage }: AddCategoryModalProps) => {
  const [adding, setAdding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCategoryFormData>();

  const closeModal = () => {
    reset();
    modalHide('add-category-modal');
  };

  const onSubmit = async (data: AddCategoryFormData) => {
    if (!accessIds) return;

    setAdding(true);
    try {
      const response = await categoriesService.addCategory(
        { name: data.name.trim() },
        {
          module_unique_id: accessIds.module_unique_id,
          sub_module_unique_id: accessIds.sub_module_unique_id,
        }
      );

      if (response.success) {
        setSuccessMessage('Category added successfully');
        showAlert('success-alert');
        reset();
        modalHide('add-category-modal');
        onSuccess(response.data?.unique_id);
      } else {
        setError(response.message || 'Failed to add category');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add category'));
      showAlert('error-alert');
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="xui-modal" xui-modal="add-category-modal">
      <div className="xui-modal-content xui-max-w-[400px] xui-bdr-rad-[8px]">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-[18px]">Add Category</h3>
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
            <label htmlFor="category_name">Category Name *</label>
            <input
              type="text"
              id="category_name"
              placeholder="Enter category name"
              {...register('name', {
                required: 'Category name is required',
                minLength: { value: 3, message: 'Name must be at least 3 characters' },
                maxLength: { value: 200, message: 'Name must be less than 200 characters' },
              })}
            />
            {errors.name && (
              <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                {errors.name.message}
              </span>
            )}
          </div>
          <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
            <button
              type="button"
              className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="xui-btn xui-btn-block xui-bdr-rad-[8px]"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              disabled={adding}
            >
              {adding ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddCategoryModal;
