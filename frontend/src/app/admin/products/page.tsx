'use client';

import { useEffect, useState } from 'react';
import { LucideSearch, LucideFilter, LucidePlus, LucideEdit2, LucideTrash2, PackageOpen, TrendingUp } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';

import { ProductResponse } from '@/types/product';
import { getAllCategories } from '@/store/slices/categorySlice';
import { deleteProduct, getAllProducts } from '@/store/slices/productSlice';

import { getProductImage } from '@/utils/pathResolution';

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
const effectivePrice = (product: ProductResponse) => product.offerPrice > 0 && product.offerPrice < product.sellingPrice ? product.offerPrice : product.sellingPrice;
const productEarnings = (product: ProductResponse) => effectivePrice(product) - product.price;
const productMargin = (product: ProductResponse) => effectivePrice(product) > 0 ? (productEarnings(product) / effectivePrice(product)) * 100 : 0;
const customerDiscount = (product: ProductResponse) => product.sellingPrice > 0 && product.offerPrice > 0 && product.offerPrice < product.sellingPrice ? ((product.sellingPrice - product.offerPrice) / product.sellingPrice) * 100 : 0;

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
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Inventory</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">Catalog</h1><p className="mt-1 text-sm text-stone-500">Manage products, pricing, and stock in one place.</p></div>
        <button onClick={handleOpenCreateModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900"><LucidePlus size={18}/> Add product</button>
      </div>

      <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1"><span className="sr-only">Search catalog</span><LucideSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18}/><input type="search" placeholder="Search by product or category" className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></label>
          <div className="flex min-w-0 items-center gap-2"><LucideFilter size={17} className="shrink-0 text-stone-400"/><div className="flex gap-2 overflow-x-auto pb-1">{categoryFilters.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${selectedCategory === category ? 'bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{category}</button>)}</div></div>
        </div>
        <p className="mt-4 text-xs text-stone-500">Showing <span className="font-semibold text-stone-800">{filteredProducts.length}</span> of {products.length} items</p>
      </section>

      {filteredProducts.length > 0 ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredProducts.map((product) => <article key={product.id} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg">
          <div className="relative h-48 overflow-hidden bg-stone-100"><img src={getProductImage(product.image_url)} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"/><span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${product.quantity > 0 ? 'bg-white/95 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}</span></div>
          <div className="p-4"><div className="flex items-center justify-between gap-3"><span className="truncate rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">{product.category.name}</span><span className="text-xs text-stone-400">#{product.id}</span></div>
            <h2 className="mt-3 line-clamp-1 text-base font-semibold text-stone-900" title={product.name}>{product.name}</h2><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-stone-500">{product.description}</p>
            <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-3"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Selling price</p><div className="mt-1 flex flex-wrap items-center gap-2">{customerDiscount(product) > 0 ? <><span className="text-lg font-bold text-stone-900">{money(effectivePrice(product))}</span><span className="text-xs text-stone-400 line-through">{money(product.sellingPrice)}</span><span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">{customerDiscount(product).toFixed(0)}% off</span></> : <span className="text-lg font-bold text-stone-900">{money(product.sellingPrice)}</span>}</div></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${product.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{product.quantity > 0 ? 'Active' : 'Needs restock'}</span></div>
            <div title="Estimated gross earnings after discount, before payment and shipping expenses." className={`mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${productEarnings(product) >= 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800'}`}><span className="inline-flex items-center gap-1.5 text-xs font-medium"><TrendingUp size={14}/> Est. earnings / item</span><div className="text-right"><span className="text-sm font-bold">{money(productEarnings(product))}</span><span className="ml-2 text-xs font-semibold">{productMargin(product).toFixed(1)}% margin</span></div></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => handleEdit(product)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"><LucideEdit2 size={15}/> Edit</button><button onClick={() => handleDelete(product.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"><LucideTrash2 size={15}/> Delete</button></div>
          </div>
        </article>)}
      </div> : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-stone-300 bg-white text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-500"><PackageOpen size={22}/></span><h2 className="mt-3 font-semibold text-stone-900">No catalog items found</h2><p className="mt-1 text-sm text-stone-500">Try another search or category.</p></div></div>}

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
