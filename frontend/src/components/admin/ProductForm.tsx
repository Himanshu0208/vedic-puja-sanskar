'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LucideX, LucideUpload } from 'lucide-react';
import toast from 'react-hot-toast';

import { CreateProductInput, ProductResponse, UpdateProductInput, DeleteProductResponse, ProductListResponse } from '@/types/product';
import { AppDispatch, RootState } from '@/store';
import { createProduct, updateProduct } from '@/store/slices/productSlice';

interface ProductFormData {
  name: string;
  description: string;
  categoryId: number;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  offerPrice: number;
  benefits: string;
  image: File | null;
}

interface ProductFormProps {
  onClose: () => void;
  product: ProductResponse | null
}

export default function ProductForm({
  onClose,
  product
}: ProductFormProps) {
  const isEditMode = Boolean(product);
  const [formData, setFormData] = useState<CreateProductInput>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    categoryId: product?.category.id ?? 0,
    quantity: product?.quantity ?? 0,
    sellingPrice: product?.sellingPrice ?? 0,
    costPrice: product?.price ?? 0,
    offerPrice: product?.offerPrice ?? 0,
    benefits: product?.benefits ?? '',
    imageURL: product?.image_url,
    imagePath: product?.image_path,
    image: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(product?.image_url ?? '');
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const selectedCategoryId = formData.categoryId;

  const dispatch = useDispatch<AppDispatch>();
  const {category, isCategoryLoading} = useSelector((state: RootState) => state.category);

  const categories = category;
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      setIsLoading(false);
      return;
    }

    if(isEditMode && product) {
      try {
        const result = await dispatch(updateProduct({productId: product.id, productData: formData}));
        toast.success('Product updated successfully');
        onClose();
      } catch (error) {
        console.error('Error submitting form:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create product');
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const result = await dispatch(createProduct(formData));
        toast.success('Product created successfully');
        onClose();
      } catch (error) {
        console.error('Error submitting form:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create product');
      } finally {
        setIsLoading(false);
      }
    }

  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!selectedCategoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Valid selling price is required';
    }
    if (!formData.costPrice || formData.costPrice <= 0) {
      newErrors.costPrice = 'Valid cost price is required';
    }
    if (formData.costPrice > formData.sellingPrice) {
      newErrors.sellingPrice = 'Selling price must be greater than cost price';
    }
    if (formData.offerPrice && formData.offerPrice > formData.sellingPrice) {
      newErrors.offerPrice = 'Offer price must be less than or equal to selling price';
    }
    if (!formData.benefits.trim()) {
      newErrors.benefits = 'Benefits are required';
    }
    if (!formData.image && !formData.imageURL) {
      newErrors.image = 'Product image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = ['categoryId', 'quantity', 'sellingPrice', 'costPrice', 'offerPrice'];

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
    if (errors[name as keyof ProductFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        console.error('Invalid file type:', file.type);
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        console.error('File size exceeds limit:', file.size);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      if (errors.image) {
        setErrors((prev) => ({
          ...prev,
          image: undefined,
        }));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky z-10 top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Create New Product</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <LucideX size={24} />
          </button>
        </div> 

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Product Image <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
                className="hidden"
                id="image-input"
              />
              <label
                htmlFor="image-input"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {imagePreview ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-colors flex items-center justify-center">
                      <span className="text-white z-10 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to change
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <LucideUpload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
            {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Product Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g., Rudraksha Mala"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:opacity-50"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Category and Quantity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-900 mb-2">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={selectedCategoryId}
                onChange={handleInputChange}
                disabled={isLoading || isCategoryLoading || categories?.categories.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:opacity-50"
              >
                {isCategoryLoading && (
                  <option value={0}>Loading categories...</option>
                )}
                {!isCategoryLoading && categories === null && (
                  <option value={0}>No categories found</option>
                )}
                {!isCategoryLoading && categories?.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-semibold text-gray-900 mb-2">
                Quantity <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Enter quantity"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:opacity-50"
              />
              {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Enter product description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:opacity-50 resize-none"
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Benefits */}
          <div>
            <label htmlFor="benefits" className="block text-sm font-semibold text-gray-900 mb-2">
              Health Benefits <span className="text-red-600">*</span>
            </label>
            <textarea
              id="benefits"
              name="benefits"
              value={formData.benefits}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Enter health benefits (separate by commas or newlines)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:opacity-50 resize-none"
            />
            {errors.benefits && <p className="text-red-600 text-sm mt-1">{errors.benefits}</p>}
          </div>

          {/* Cost Price, Selling Price, and Offer Price Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="costPrice" className="block text-sm font-semibold text-gray-900 mb-2">
                Cost Price (₹) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Enter cost price"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:opacity-50"
              />
              {errors.costPrice && <p className="text-red-600 text-sm mt-1">{errors.costPrice}</p>}
            </div>

            <div>
              <label htmlFor="sellingPrice" className="block text-sm font-semibold text-gray-900 mb-2">
                Selling Price (₹) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="sellingPrice"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Enter selling price"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:opacity-50"
              />
              {errors.sellingPrice && (
                <p className="text-red-600 text-sm mt-1">{errors.sellingPrice}</p>
              )}
            </div>

            <div>
              <label htmlFor="offerPrice" className="block text-sm font-semibold text-gray-900 mb-2">
                Offer Price (₹)
              </label>
              <input
                type="number"
                id="offerPrice"
                name="offerPrice"
                value={formData.offerPrice}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Optional offer price"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:opacity-50"
              />
              {errors.offerPrice && <p className="text-red-600 text-sm mt-1">{errors.offerPrice}</p>}
            </div>
          </div>

          {/* Price Breakdown Display */}
          <div className="space-y-2">
            {formData.costPrice && formData.sellingPrice && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Profit Margin:</span>{' '}
                  <span className="text-green-600 font-bold">
                    ₹{(formData.sellingPrice - formData.costPrice).toFixed(2)} (
                    {(
                      (formData.sellingPrice - formData.costPrice) /
                        formData.costPrice *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </p>
              </div>
            )}

            {formData.offerPrice && formData.sellingPrice && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Discount:</span>{' '}
                  <span className="text-red-600 font-bold">
                    ₹{(formData.sellingPrice - formData.offerPrice).toFixed(2)} (
                    {(
                      (formData.sellingPrice - formData.offerPrice) /
                        formData.sellingPrice *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

