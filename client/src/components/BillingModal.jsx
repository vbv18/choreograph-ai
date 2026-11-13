import { AnimatePresence, motion } from "motion/react";
import { Crown, PanelRightClose } from "lucide-react";
import { PLANS } from "../lib/data.js";
import { useDispatch, useSelector } from "react-redux";
import createOrder from "../features/createOrder.js";
import verifyPayment from "../features/verifyPayment.js";
import getCurrentUser from "../features/getCurrentUser.js";
import { setUserData } from "../redux/userSlice.js";

export default function BillingModal({ open, onClose }) {
  const { userData } = useSelector((state) => state.user);
  const plan = PLANS[userData?.planId] ?? PLANS["free"];
  const credits = userData?.credits ?? plan?.credits ?? 125;
  const totalCredits = userData?.totalCredits ?? plan?.totalCredits ?? 125;
  const dispatch = useDispatch();

  async function handleUpgradeButton(planId) {
    try {
      const payload = {
        planId,
      };

      const { order, plan } = await createOrder(payload);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order?.amount,
        currency: order?.currency,
        name: "Choreograph AI",
        description: `${plan?.name} Plan`,
        order_id: order?.id,
        handler: async (res) => {
          try {
            await verifyPayment(res);

            const updatedUser = await getCurrentUser();
            dispatch(setUserData(updatedUser));
          } catch (error) {
            console.error("[Plan-Purchase-Handler Error", {
              status: error.response?.status,
              message: error.message,
              data: error.response?.data,
            });

            throw error;
          }
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {}
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="billing-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Billing Drawer */}
          <motion.div
            key="billing-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[380px] flex-col border-1 border-white/10 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <div
                  id="billing-title"
                  className="text-lg font-semibold text-white"
                >
                  Billing
                </div>
                <div className="text-sm text-slate-400">Plans & Credits</div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
              >
                <PanelRightClose size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Current Plan */}
            <div className="p-5">
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p>Current Plan</p>
                    <h3 className="text-white text-xl font-bold">
                      {plan.name}
                    </h3>
                  </div>
                  <Crown size={18} className="text-yellow-500" />
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Credits</span>
                    <span>
                      {credits}/{totalCredits}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${((credits || 0) / (totalCredits || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 flex-1 overflow-auto space-y-4">
              {/* Starter Plan */}
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="text-white font-semibold">
                  {PLANS["starter"].name} Plan
                </h3>
                <div className="flex justify-between items-center px-2">
                  <p className="text-indigo-400 text-2xl font-bold mt-2">
                    ₹ {PLANS["starter"].amount}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {PLANS["starter"].credits} Credits
                  </p>
                </div>
                <button
                  onClick={() => handleUpgradeButton(PLANS["starter"].id)}
                  className="mt-4 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 cursor-pointer"
                >
                  Upgrade
                </button>
              </div>

              {/* Pro PLan */}
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="text-white font-semibold">
                  {PLANS["pro"].name} Plan
                </h3>
                <div className="flex justify-between items-center px-2">
                  <p className="text-indigo-400 text-2xl font-bold mt-2">
                    ₹ {PLANS["pro"].amount}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {PLANS["pro"].credits} Credits
                  </p>
                </div>
                <button
                  onClick={() => handleUpgradeButton(PLANS["pro"].id)}
                  className="mt-4 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 cursor-pointer"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
