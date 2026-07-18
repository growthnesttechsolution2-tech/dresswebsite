import React, { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShieldCheck, TicketPercent } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { imgUrl } from "../api/api";
import { useAuth } from "../context/AuthContext";
import Auth from "./Auth";

const addressFields = ["fullName", "phone", "alternatePhone", "address", "city", "district", "state", "pincode"];

export default function Checkout() {
  const { user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [address, setAddress] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [cartItems, setCartItems] = useState([]);
  const [buyNowQuantity, setBuyNowQuantity] = useState(state?.quantity || 1);
  const [qrConfirmed, setQrConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (!state?.buyNow && user) {
      api.get("/cart").then((r) => setCartItems(r.data)).catch(() => setCartItems([]));
    }
  }, [state?.buyNow, user]);

  const checkoutItems = useMemo(() => {
    if (state?.buyNow) return [{ product: state.buyNow, quantity: buyNowQuantity }];
    return cartItems;
  }, [buyNowQuantity, cartItems, state?.buyNow]);

  const subtotal = checkoutItems.reduce((sum, item) => {
    const price = Number(item.product?.discountPrice || item.product?.price || 0);
    return sum + price * Number(item.quantity || 1);
  }, 0);

  const shippingFee = checkoutItems.reduce((sum, item) => {
    if (item.product?.freeShipping) return sum;
    return sum + Number(item.product?.shippingCharge || 0);
  }, 0);

  const amount = subtotal + shippingFee;

  if (!user) return <Auth />;

  const handleChange = (e) => setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const updateCartQuantity = async (item, qty) => {
    const next = Math.max(1, qty);
    if (state?.buyNow) { setBuyNowQuantity(next); return; }
    await api.put(`/cart/${item._id}`, { quantity: next });
    setCartItems((cur) => cur.map((ci) => ci._id === item._id ? { ...ci, quantity: next } : ci));
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!checkoutItems.length) { alert("No items in checkout"); return; }

    if (paymentMethod === "Scan & Pay" && !qrConfirmed) {
      alert("QR scan pannitu pay pannitu, 'I have completed the payment' checkbox tick pannunga");
      return;
    }

    if (paymentMethod === "Scan & Pay" && !transactionId.trim()) {
      alert("UPI Transaction ID / UTR Number podunga (payment app la varum)");
      return;
    }

    const paymentStatus = paymentMethod === "Scan & Pay" ? "Paid - Verify Manually" : "Pending";

    const items = checkoutItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.discountPrice || item.product.price,
      quantity: item.quantity || 1,
      size: item.size,
      color: item.color,
      image: item.product.images?.[0],
    }));

    try {
      await api.post("/orders", {
        items,
        address,
        amount,
        paymentMethod: paymentMethod.trim(),
        paymentStatus,
        transactionId: paymentMethod === "Scan & Pay" ? transactionId.trim() : undefined,
      });
      alert("Order placed successfully");
      navigate("/orders");
    } catch (err) {
      console.error("Place order error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to place order. Please try again.");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-3 py-6 md:px-4 md:py-10">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-600">Secure Checkout</p>
        <h1 className="text-2xl font-black text-blue-950 md:text-5xl">Place Your Order</h1>
      </div>

      <form onSubmit={placeOrder} className="grid gap-5 lg:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-lg md:rounded-[2rem] md:p-5">
            <h2 className="mb-3 text-lg font-black text-slate-950 md:text-2xl">Products</h2>
            <div className="grid gap-3">
              {checkoutItems.map((item) => {
                const product = item.product;
                const itemPrice = Number(product?.discountPrice || product?.price || 0);
                return (
                  <div key={product?._id || item._id} className="flex gap-3 rounded-xl bg-blue-50/60 p-3 md:rounded-[1.6rem] md:p-4">
                    <img src={imgUrl(product?.images?.[0])} alt={product?.name} className="h-20 w-20 flex-shrink-0 rounded-xl object-cover md:h-28 md:w-28 md:rounded-2xl" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-950 md:text-xl">{product?.name}</h3>
                        <p className="mt-0.5 text-sm font-bold text-blue-700">₹{itemPrice}</p>
                        <p className="text-xs text-slate-500">{product?.subCategory || product?.mainCategory}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button type="button" className="rounded-full bg-white p-2 text-blue-700" onClick={() => updateCartQuantity(item, Number(item.quantity || 1) - 1)}><Minus className="h-3 w-3" /></button>
                        <span className="min-w-6 text-center text-sm font-black">{item.quantity || 1}</span>
                        <button type="button" className="rounded-full bg-white p-2 text-blue-700" onClick={() => updateCartQuantity(item, Number(item.quantity || 1) + 1)}><Plus className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-lg md:rounded-[2rem] md:p-5">
            <h2 className="mb-3 text-lg font-black text-slate-950 md:text-2xl">Delivery Address</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {addressFields.map((field) => (
                <input key={field} name={field} onChange={handleChange} placeholder={field} className="input text-sm" required={field !== "alternatePhone"} />
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-blue-100 bg-white p-5 shadow-xl md:rounded-[2rem] md:p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-black text-slate-950 md:text-2xl">Order Summary</h2>
          <div className="mt-4 rounded-2xl bg-blue-50 p-3 md:rounded-3xl md:p-4">
            <div className="flex items-center gap-2 text-sm font-black text-blue-700"><TicketPercent className="h-4 w-4" /> Coupon</div>
            <p className="mt-1 text-xs text-slate-500">Coupon UI added. Backend logic can be added later.</p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600 md:mt-5 md:space-y-3">
            <div className="flex justify-between"><span>Items</span><b>{checkoutItems.length}</b></div>
            <div className="flex justify-between"><span>Subtotal</span><b>₹{subtotal}</b></div>
            <div className="flex justify-between">
              <span>Delivery</span>
              {shippingFee === 0 ? <b className="text-green-600">Free</b> : <b className="text-slate-900">₹{shippingFee}</b>}
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between text-2xl font-black text-blue-950"><span>Total</span><span>₹{amount}</span></div>
          </div>
          <div className="mt-5 grid gap-2 md:mt-6 md:gap-3">
            {["Cash on Delivery", "Scan & Pay"].map((method) => (
              <label key={method} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm font-black transition md:rounded-2xl md:p-4 ${paymentMethod === method ? "border-blue-600 bg-blue-50 text-blue-700" : "border-blue-100 text-slate-600"}`}>
                <span>{method}</span>
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setQrConfirmed(false);
                  }}
                />
              </label>
            ))}
          </div>

          {paymentMethod === "Scan & Pay" && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-center">
              <p className="mb-2 text-sm font-black text-blue-950">Scan this QR code to pay ₹{amount}</p>
              <img
                src="/qr code.jpeg"
                alt="Payment QR Code"
                className="mx-auto h-48 w-48 rounded-xl border border-blue-200 bg-white object-contain p-2"
              />
              <p className="mt-2 text-xs text-slate-500">
                UPI app la QR scan pannitu, ₹{amount} pay pannunga. Pay panna apparam keezha checkbox tick pannunga.
              </p>
              <label className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={qrConfirmed}
                  onChange={(e) => setQrConfirmed(e.target.checked)}
                />
                I have completed the payment
              </label>

              <div className="mt-3 text-left">
                <label className="mb-1 block text-xs font-black text-slate-700">
                  UPI Transaction ID / UTR Number
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 402812345678"
                  className="input text-sm"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Payment app (GPay/PhonePe/Paytm) la irundhu transaction ID copy pannitu paste pannunga
                </p>
              </div>
            </div>
          )}

          <button className="btn-primary mt-5 w-full text-sm md:mt-6">Place Order</button>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 md:mt-4"><ShieldCheck className="h-4 w-4" /> Secure payment & order</p>
        </aside>
      </form>
    </section>
  );
}