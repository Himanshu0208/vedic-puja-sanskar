'use client';

import { useEffect, useState } from 'react';
import { LucideSearch, LucideFilter, LucidePlus, LucideEdit2, LucideTrash2, LucideStar } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';

import { ProductResponse } from '@/types/product';
import { CategoryListResponse } from '@/types/category';
import { getAllCategories } from '@/store/slices/categorySlice';
import { deleteProduct, getAllProducts } from '@/store/slices/productSlice';

import { getProductImage } from '@/utils/pathResolution';

export default function AdminProducts() {
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);


  const dispatch = useDispatch<AppDispatch>();
  const { category } = useSelector((state: RootState) => state.category);
  const { products } = useSelector((state: RootState) => state.product);

  useEffect(() => {
    dispatch(getAllCategories());
    dispatch(getAllProducts());
  }, []);

  const categories = category !== null ? category.categories.map((category) => category.name) : [];
  const categoryFilters = ['All', ...categories];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || product.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteProduct(id));
      toast.success("Product Deleted Successfully");
    } catch(error) {
      console.log("failed to delete prodcut [", id,"]");
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  const handleEdit = (product: ProductResponse) => {
    const updatedProduct: ProductResponse = {
      ...product,
      image_url: getProductImage(product.image_url)
    }
    setEditingProduct(updatedProduct);
    setShowCreateModal(true);
  }

  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);

    try {
      const result = await dispatch(getAllCategories());
    } catch (error: unknown) {
      console.error('Error fetching categories:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch categories');
    } finally {
    }
  };

  return (
    <>
        {/* Search, Filter, and Create Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <LucideSearch className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search product by name or category..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter and Create Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              {/* Filter */}
              <div className="flex gap-2 flex-wrap">
                {categoryFilters.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedCategory === category
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <LucideFilter size={16} className="inline mr-2" />
                    {category}
                  </button>
                ))}
              </div>

              {/* Create Button */}
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
              >
                <LucidePlus size={20} />
                Create Product
              </button>
            </div>

            {/* Results Count */}
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} product
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={getProductImage(product.image_url)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Category and Rating */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {product.category.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <LucideStar size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold">{
                      // product.rating
                      0
                      }</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                  {/* Price and Stock */}
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      {product.offerPrice ? (
                        <>
                          <p className="text-xl font-bold text-red-600">₹{product.offerPrice}</p>
                          <p className="text-sm line-through text-gray-400">₹{product.price}</p>
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                            {Math.round(((product.price - product.offerPrice) / product.price) * 100)}% OFF
                          </span>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-amber-600">₹{product.price}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Cost: <span className="text-gray-700 font-semibold">₹{product.price}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock:{' '}
                      <span className={product.quantity > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {product.quantity}
                      </span>
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="mb-3 p-2 bg-green-50 rounded">
                    <p className="text-xs text-green-800 font-semibold mb-1">Benefits:</p>
                    <p className="text-xs text-green-700 line-clamp-2">{product.benefits}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                    >
                      <LucideEdit2 size={16} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-600 px-3 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                    >
                      <LucideTrash2 size={16} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No product found</p>
            </div>
          )}
        </div>

      {/* Create Product Form Modal */}
      {showCreateModal && (
        <ProductForm
          onClose={() => {
            setShowCreateModal(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
        />
      )}
    </>
  );
}
