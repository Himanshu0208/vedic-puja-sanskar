"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  LucideX,
  TrendingUp,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

import { CreateProductInput, ProductResponse } from "@/types/product";
import { AppDispatch, RootState } from "@/store";
import { createProduct, updateProduct } from "@/store/slices/productSlice";

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
  product: ProductResponse | null;
}

const fieldClass =
  "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";
const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
const errorMessage = (error: unknown, fallback: string) =>
  typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : fallback;

export default function ProductForm({ onClose, product }: ProductFormProps) {
  const isEditMode = Boolean(product);
  const [formData, setFormData] = useState<CreateProductInput>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.category.id ?? 0,
    quantity: product?.quantity ?? 0,
    sellingPrice: product?.sellingPrice ?? 0,
    costPrice: product?.price ?? 0,
    offerPrice: product?.offerPrice ?? 0,
    benefits: product?.benefits ?? "",
    imageURL: product?.image_url,
    imagePath: product?.image_path,
    image: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(
    product?.image_url ?? "",
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormData, string>>
  >({});
  const selectedCategoryId = formData.categoryId;
  const effectivePrice =
    (formData.offerPrice ?? 0) > 0 &&
    (formData.offerPrice ?? 0) < formData.sellingPrice
      ? (formData.offerPrice ?? formData.sellingPrice)
      : formData.sellingPrice;
  const expectedEarnings = effectivePrice - formData.costPrice;
  const earningsMargin =
    effectivePrice > 0 ? (expectedEarnings / effectivePrice) * 100 : 0;

  const dispatch = useDispatch<AppDispatch>();
  const { category, isCategoryLoading } = useSelector(
    (state: RootState) => state.category,
  );

  const categories = category;
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      setIsLoading(false);
      return;
    }

    if (isEditMode && product) {
      try {
        await dispatch(
          updateProduct({ productId: product.id, productData: formData }),
        ).unwrap();
        onClose();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error(errorMessage(error, "Failed to update product"));
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        await dispatch(createProduct(formData)).unwrap();
        onClose();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error(errorMessage(error, "Failed to create product"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!selectedCategoryId) {
      newErrors.categoryId = "Category is required";
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }
    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      newErrors.sellingPrice = "Valid selling price is required";
    }
    if (!formData.costPrice || formData.costPrice <= 0) {
      newErrors.costPrice = "Valid cost price is required";
    }
    if (formData.costPrice >= formData.sellingPrice) {
      newErrors.sellingPrice = "Selling price must be greater than cost price";
    }
    if (formData.offerPrice && formData.offerPrice <= formData.costPrice) {
      newErrors.offerPrice = "Offer price must be greater than cost price";
    }
    if (formData.offerPrice && formData.offerPrice > formData.sellingPrice) {
      newErrors.offerPrice =
        "Offer price must be less than or equal to selling price";
    }
    if (!formData.benefits.trim()) {
      newErrors.benefits = "Benefits are required";
    }
    if (!formData.image && !formData.imageURL) {
      newErrors.image = "Product image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const numericFields = [
      "categoryId",
      "quantity",
      "sellingPrice",
      "costPrice",
      "offerPrice",
    ];

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
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        console.error("Invalid file type:", file.type);
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        console.error("File size exceeds limit:", file.size);
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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-stone-950/45 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !isLoading && onClose()
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-2xl shadow-stone-950/20 sm:max-h-[calc(100dvh-3rem)]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-100 via-orange-50 to-rose-50 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-amber-800 shadow-sm">
              <ImagePlus size={19} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                Catalog
              </p>
              <h2
                id="product-form-title"
                className="mt-0.5 text-lg font-semibold tracking-tight text-stone-950 sm:text-xl"
              >
                {isEditMode ? "Edit catalog item" : "Add catalog item"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close product form"
            className="grid h-9 w-9 place-items-center rounded-xl text-stone-500 transition hover:bg-white/80 hover:text-stone-900 disabled:opacity-50"
          >
            <LucideX size={19} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 overflow-y-auto p-5 sm:space-y-6 sm:p-7"
        >
          {/* Image Upload */}
          <div>
            <label className={labelClass}>
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
                className="flex h-44 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/60 transition hover:border-amber-500 hover:from-amber-100 hover:to-orange-100"
              >
                {imagePreview ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full rounded-2xl object-cover"
                    />
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-colors flex items-center justify-center">
                      <span className="text-white z-10 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to change
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-amber-800 shadow-sm">
                      <Upload size={20} />
                    </span>
                    <p className="text-sm font-semibold text-stone-800">
                      Click to upload an image
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
              </label>
            </div>
            {errors.image && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.image}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className={labelClass}>
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
              className={fieldClass}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          {/* Category and Quantity Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="categoryId" className={labelClass}>
                Category <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <select
                  id="categoryId"
                  name="categoryId"
                  value={selectedCategoryId}
                  onChange={handleInputChange}
                  disabled={
                    isLoading ||
                    isCategoryLoading ||
                    categories?.categories.length === 0
                  }
                  className={`${fieldClass} appearance-none pr-9`}
                >
                  {isCategoryLoading && (
                    <option value={0}>Loading categories...</option>
                  )}
                  {!isCategoryLoading && categories === null && (
                    <option value={0}>No categories found</option>
                  )}
                  {!isCategoryLoading &&
                    categories?.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
              {errors.categoryId && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="quantity" className={labelClass}>
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
                className={fieldClass}
              />
              {errors.quantity && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.quantity}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className={labelClass}>
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
              className={`${fieldClass} resize-y`}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          {/* Benefits */}
          <div>
            <label htmlFor="benefits" className={labelClass}>
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
              className={`${fieldClass} resize-y`}
            />
            {errors.benefits && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.benefits}
              </p>
            )}
          </div>

          {/* Cost Price, Selling Price, and Offer Price Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="costPrice" className={labelClass}>
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
                className={fieldClass}
              />
              {errors.costPrice && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.costPrice}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sellingPrice" className={labelClass}>
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
                className={fieldClass}
              />
              {errors.sellingPrice && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.sellingPrice}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="offerPrice" className={labelClass}>
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
                className={fieldClass}
              />
              {errors.offerPrice && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.offerPrice}
                </p>
              )}
            </div>
          </div>

          {/* Price Breakdown Display */}
          {formData.costPrice > 0 && formData.sellingPrice > 0 && (
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">
                  <TrendingUp size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Estimated earnings after offer
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-800/80">
                    {money(effectivePrice)} sale price −{" "}
                    {money(formData.costPrice)} cost price, per item
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-800/65">
                    Before payment, shipping, and other expenses
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <p
                  className={`text-xl font-bold ${expectedEarnings >= 0 ? "text-emerald-800" : "text-red-700"}`}
                >
                  {money(expectedEarnings)}
                </p>
                <p className="text-xs text-emerald-800/80">
                  {earningsMargin.toFixed(1)}% margin
                </p>
              </div>
            </div>
          )}

          {(formData.offerPrice ?? 0) > 0 && formData.sellingPrice > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              <span className="font-semibold">Customer discount:</span>{" "}
              {money(formData.sellingPrice - (formData.offerPrice ?? 0))} (
              {(
                ((formData.sellingPrice - (formData.offerPrice ?? 0)) /
                  formData.sellingPrice) *
                100
              ).toFixed(1)}
              %) off the listed selling price
            </div>
          )}

          {/* Buttons */}
          <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-3 border-t border-stone-100 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-7 sm:-mb-7 sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  {isEditMode ? "Saving…" : "Creating…"}
                </>
              ) : (
                <>
                  {isEditMode ? "Save changes" : "Add to catalog"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
