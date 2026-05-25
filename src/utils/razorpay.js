let razorpayScriptPromise = null;

const createRazorpayError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

export const loadRazorpayScript = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(createRazorpayError("Unable to load Razorpay checkout.", "RAZORPAY_SCRIPT_LOAD_FAILED"));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

export const buildRazorpayReceipt = (value = "payment") => {
  const normalized = String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 24);
  const suffix = Date.now().toString().slice(-10);
  return `${normalized || "payment"}_${suffix}`.slice(0, 40);
};

export const openRazorpayCheckout = async ({
  key,
  amount,
  amountInSubunits,
  currency = "INR",
  orderId,
  name,
  description,
  prefill = {},
  notes = {},
  themeColor = "#1f6b11",
}) => {
  if (!key) {
    throw createRazorpayError("Razorpay key is not configured.", "RAZORPAY_KEY_MISSING");
  }

  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const normalizedAmount =
      Number.isFinite(Number(amountInSubunits)) && Number(amountInSubunits) > 0
        ? Math.round(Number(amountInSubunits))
        : Math.round(Number(amount || 0) * 100);

    const options = {
      key,
      amount: normalizedAmount,
      currency,
      name: name || "AgroConnect",
      description: description || "Payment checkout",
      order_id: orderId,
      prefill: {
        name: prefill.name || "",
        email: prefill.email || "",
        contact: prefill.contact || "",
      },
      notes,
      theme: {
        color: themeColor,
      },
      modal: {
        ondismiss: () => reject(createRazorpayError("Payment cancelled by user", "RAZORPAY_CANCELLED")),
      },
      handler: (response) => resolve(response),
    };

    if (orderId) {
      options.order_id = orderId;
    }

    const instance = new window.Razorpay(options);
    instance.on("payment.failed", (response) => {
      reject(
        createRazorpayError(
          response?.error?.description || "Razorpay payment failed",
          "RAZORPAY_PAYMENT_FAILED"
        )
      );
    });
    instance.open();
  });
};
