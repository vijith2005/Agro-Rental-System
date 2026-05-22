let razorpayScriptPromise = null;

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
      script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

export const openRazorpayCheckout = async ({
  key,
  amount,
  orderId,
  name,
  description,
  prefill = {},
  notes = {},
  themeColor = "#1f6b11",
}) => {
  if (!key) {
    throw new Error("Razorpay key is not configured.");
  }

  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount: Math.round(Number(amount || 0) * 100),
      currency: "INR",
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
        ondismiss: () => reject(new Error("Payment cancelled by user")),
      },
      handler: (response) => resolve(response),
    };

    const instance = new window.Razorpay(options);
    instance.on("payment.failed", (response) => {
      reject(new Error(response?.error?.description || "Razorpay payment failed"));
    });
    instance.open();
  });
};
