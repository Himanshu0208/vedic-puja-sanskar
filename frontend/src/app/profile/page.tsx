"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { RootState, AppDispatch } from "@/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { authService } from "@/services/api/authService";
import { orderService } from "@/services/api/orderService";
import { productService } from "@/services/api/productService";
import type { SavedAddress, ShippingAddress, UserOrder } from "@/types/order";
import type { ProductResponse } from "@/types/product";
import { getProductImage } from "@/utils/pathResolution";

type Profile = {
  id: number;
  fullName: string;
  phone: string;
  gender: string;
  email: string;
  role: string;
};
const blankAddress: ShippingAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
};
const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-800 outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100";
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
    amount,
  );

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const authenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("prefer_not_to_say");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const safeOrders = Array.isArray(orders) ? orders : [];
  const [addressError, setAddressError] = useState("");
  const [wishlist, setWishlist] = useState<ProductResponse[]>([]);
  const [addressDraft, setAddressDraft] =
    useState<ShippingAddress>(blankAddress);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const addressRequest = orderService
      .getAddresses()
      .then((data) => {
        setAddresses(data);
        setAddressError("");
      })
      .catch((error: unknown) => {
        setAddressError(
          error instanceof Error
            ? error.message
            : "Could not load saved addresses.",
        );
      });
    const [p, o, ids] = await Promise.all([
      authService.getProfile(),
      orderService
        .getOrders({ page: 1, pageSize: 5 })
        .then((res: unknown) => {
          if (Array.isArray(res)) return res as UserOrder[];
          if (res && typeof res === "object" && "orders" in res && Array.isArray((res as { orders: UserOrder[] }).orders)) {
            return (res as { orders: UserOrder[] }).orders;
          }
          return [] as UserOrder[];
        })
        .catch(() => []),
      authService.getWishlist().catch(() => []),
    ]);
    await addressRequest;
    setProfile(p as Profile);
    setName((p as Profile).fullName);
    setPhone((p as Profile).phone);
    setGender((p as Profile).gender || "prefer_not_to_say");
    setOrders(Array.isArray(o) ? o : []);
    const wishedProducts = await Promise.all(
      ids.map((id) =>
        productService.getProductById(String(id)).catch(() => null),
      ),
    );
    setWishlist(
      wishedProducts.filter((item): item is ProductResponse => item !== null),
    );
  }, []);
  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh()
      .catch((e) =>
        toast.error(
          e instanceof Error ? e.message : "Could not load your profile.",
        ),
      )
      .finally(() => setLoading(false));
  }, [authenticated, refresh]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      setProfile(
        (await authService.updateProfile({
          fullName: name,
          phone,
          ...(profile?.gender ? {} : { gender }),
        })) as Profile,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  };
  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await orderService.saveAddress(addressDraft, editingAddress ?? undefined);
      setAddressDraft(blankAddress);
      setEditingAddress(null);
      setAddresses(await orderService.getAddresses());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save address.");
    } finally {
      setBusy(false);
    }
  };
  const deleteAddress = async (id: number) => {
    try {
      await orderService.deleteAddress(id);
      setAddresses((items) => items.filter((item) => item.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete address.");
    }
  };
  const removeWish = async (id: number) => {
    try {
      await authService.removeWishlist(id);
      setWishlist((items) => items.filter((item) => item.id !== id));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not update wishlist.",
      );
    }
  };
  const editAddress = (address: SavedAddress) => {
    const { id, ...fields } = address;
    setEditingAddress(id);
    setAddressDraft(fields);
  };

  if (!authenticated)
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-4 py-12">
        <div className="w-full rounded-3xl border border-amber-100 bg-white p-10 text-center shadow-sm">
          <UserRound className="mx-auto text-amber-800" size={34} />
          <h1 className="mt-4 font-serif text-3xl text-stone-900">
            Your account
          </h1>
          <p className="mt-2 text-stone-600">
            Sign in to manage your profile, wishlist, orders, and delivery
            addresses.
          </p>
          <button
            onClick={() => dispatch(openAuthModal("login"))}
            className="mt-6 rounded-xl bg-amber-800 px-5 py-3 text-sm font-semibold text-white"
          >
            Sign in
          </button>
        </div>
      </main>
    );
  if (loading)
    return (
      <main className="mx-auto min-h-[60vh] max-w-6xl animate-pulse px-4 py-10">
        <div className="h-10 w-64 rounded bg-amber-100" />
        <div className="mt-8 h-64 rounded-3xl bg-amber-50" />
      </main>
    );

  return (
    <main className="min-h-screen bg-[#fbf8f1] px-4 py-9 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-800">
              Your account
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
              Hello, {profile?.fullName || "there"}
            </h1>
            <p className="mt-2 text-stone-600">
              Your details, saved items, orders, and delivery addresses.
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-900"
          >
            All orders <ArrowRight size={16} />
          </Link>
        </div>

        <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800">
              <UserRound size={19} />
            </span>
            <div>
              <h2 className="font-semibold text-stone-900">
                Personal information
              </h2>
              <p className="text-xs text-stone-500">
                You can edit your name and contact number.
              </p>
            </div>
          </div>
          <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Full name
              <input
                required
                maxLength={120}
                className={`${inputClass} mt-1.5`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Contact number
              <input
                required
                minLength={8}
                maxLength={20}
                className={`${inputClass} mt-1.5`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Email address
              <input
                readOnly
                className={`${inputClass} mt-1.5 bg-stone-50 text-stone-500`}
                value={profile?.email ?? ""}
              />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Gender
              {profile?.gender ? (
                <input
                  readOnly
                  className={`${inputClass} mt-1.5 bg-stone-50 capitalize text-stone-500`}
                  value={profile.gender.replaceAll("_", " ")}
                />
              ) : (
                <div className="relative mt-1.5">
                  <select
                    className={`${inputClass} appearance-none pr-9`}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              )}
            </label>
            <div className="md:col-span-2">
              <button
                disabled={busy}
                className="rounded-xl bg-amber-800 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save changes
              </button>
            </div>
          </form>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700">
                <Heart size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-stone-900">Your wishlist</h2>
                <p className="text-xs text-stone-500">
                  Saved products ready when you are.
                </p>
              </div>
            </div>
            {wishlist.length ? (
              <div className="space-y-3">
                {wishlist.map((product) => (
                  <article
                    key={product.id}
                    className="flex items-center gap-3 rounded-2xl border border-stone-100 p-3"
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-50"
                    >
                      <img
                        src={getProductImage(
                          product.image_url || product.image_path,
                        )}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${product.id}`}
                        className="line-clamp-1 text-sm font-semibold text-stone-900"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-sm text-stone-600">
                        {money(
                          product.offerPrice && product.offerPrice > 0
                            ? product.offerPrice
                            : product.sellingPrice,
                          "INR",
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => void removeWish(product.id)}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-stone-50 p-5 text-sm text-stone-500">
                Your wishlist is empty. Save products from their detail page.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-800">
                  <PackageCheck size={19} />
                </span>
                <div>
                  <h2 className="font-semibold text-stone-900">
                    Recent orders
                  </h2>
                  <p className="text-xs text-stone-500">
                    Track your latest purchases.
                  </p>
                </div>
              </div>
              <Link
                href="/orders"
                className="text-sm font-semibold text-amber-900"
              >
                View all
              </Link>
            </div>
            {safeOrders.length ? (
              <div className="space-y-3">
                {safeOrders.slice(0, 3).map((order) => (
                  <article
                    key={order.orderId}
                    className="rounded-2xl border border-stone-100 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-semibold text-stone-900">
                        Order #{order.orderId}
                      </p>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm text-stone-500">
                      {order.items
                        .map((item) => `${item.productName} × ${item.quantity}`)
                        .join(", ")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-800">
                      {money(order.totalAmount, order.currency)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-stone-50 p-5 text-sm text-stone-500">
                Your orders will appear here after checkout.
              </p>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                <MapPin size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-stone-900">
                  Saved addresses
                </h2>
                <p className="text-xs text-stone-500">
                  Choose these at checkout or keep them up to date.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressDraft(blankAddress);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm font-semibold text-amber-900"
            >
              <Plus size={16} /> Add address
            </button>
          </div>
          {addressError && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {addressError}
            </p>
          )}
          {addresses.length > 0 && (
            <div className="mb-5 grid gap-3 md:grid-cols-2">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className="rounded-2xl border border-stone-100 p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900">
                        {address.fullName}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {address.phone}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-stone-500">
                        {[
                          address.line1,
                          address.line2,
                          address.city,
                          address.state,
                          address.postalCode,
                          address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => editAddress(address)}
                        aria-label="Edit address"
                        className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-amber-50 hover:text-amber-900"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => void deleteAddress(address.id)}
                        aria-label="Delete address"
                        className="grid h-9 w-9 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <form
            onSubmit={saveAddress}
            className="grid gap-3 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2"
          >
            <p className="text-sm font-semibold text-stone-800 sm:col-span-2">
              {editingAddress ? "Edit saved address" : "Add a delivery address"}
            </p>
            {(
              [
                ["fullName", "Full name"],
                ["phone", "Contact number"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2 (optional)"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "Postal code"],
                ["country", "Country code (e.g. IN)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-xs font-medium text-stone-600">
                {label}
                <input
                  required={key !== "line2"}
                  maxLength={
                    key === "line1" || key === "line2"
                      ? 255
                      : key === "country"
                        ? 2
                        : 120
                  }
                  className={`${inputClass} mt-1`}
                  value={addressDraft[key]}
                  onChange={(e) =>
                    setAddressDraft((current) => ({
                      ...current,
                      [key]:
                        key === "country"
                          ? e.target.value.toUpperCase()
                          : e.target.value,
                    }))
                  }
                />
              </label>
            ))}
            <div className="flex gap-2 sm:col-span-2">
              <button
                disabled={busy}
                className="rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {editingAddress ? "Save address" : "Add address"}
              </button>
              {editingAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressDraft(blankAddress);
                  }}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
