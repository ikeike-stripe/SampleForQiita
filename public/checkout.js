document.addEventListener("DOMContentLoaded", async () => {
  const {publishableKey} = await fetch('/config').then((r) => r.json());
  if (!publishableKey) {
    addMessage(
      'No publishable key returned from the server. Please check `.env` and try again'
    );
    alert('Please set your Stripe publishable API key in the .env file');
  }
  // This is a public sample test API key.
  // Don’t submit any personally identifiable information in requests made with this key.
  // Sign in to see your own test API key embedded in code samples.
  const stripe = Stripe(publishableKey); 

  // The items the customer wants to buy
  const items = [{ id: "xl-tshirt" }];

  let elements;

  initialize();
  checkStatus();

  document
    .querySelector("#payment-form")
    .addEventListener("submit", handleSubmit);

  let selectedPaymentMethod; // Initialize the variable

  // Fetches a payment intent and captures the client secret
  async function initialize() {
    const response = await fetch("/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const { clientSecret } = await response.json();

    const appearance = {
      theme: 'stripe',
    };
    elements = stripe.elements({ 
      appearance, 
      clientSecret,
      externalPaymentMethodTypes: ['external_paypay']
    });

    const paymentElementOptions = {
      layout: "tabs",
    };

    const paymentElement = elements.create("payment", {
      paymentMethodOrder: ['card', 'external_paypay']
    });
    paymentElement.mount("#payment-element");

    // Track selected payment method
    paymentElement.on('change', (event) => {
      selectedPaymentMethod = event?.value?.type;
    });

  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    if (selectedPaymentMethod === 'external_paypay') {
      const response = await fetch("/create-paypay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: null,
      });
      const { url } = await response.json();

      const paypayRedirectUrl =  url;
      window.location.href = paypayRedirectUrl;
    } else {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: "http://localhost:4242/checkout.html",
          receipt_email: emailAddress,
        },
      });
    }


    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      showMessage(error.message);
    } else {
      showMessage("An unexpected error occurred.");
    }

    setLoading(false);
  }

  // Fetches the payment intent status after payment submission
  async function checkStatus() {
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

    switch (paymentIntent.status) {
      case "succeeded":
        showMessage("Payment succeeded!");
        break;
      case "processing":
        showMessage("Your payment is processing.");
        break;
      case "requires_payment_method":
        showMessage("Your payment was not successful, please try again.");
        break;
      default:
        showMessage("Something went wrong.");
        break;
    }
  }

  // ------- UI helpers -------

  function showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");

    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;

    setTimeout(function () {
      messageContainer.classList.add("hidden");
      messageContainer.textContent = "";
    }, 4000);
  }

  // Show a spinner on payment submission
  function setLoading(isLoading) {
    if (isLoading) {
      // Disable the button and show a spinner
      document.querySelector("#submit").disabled = true;
      document.querySelector("#spinner").classList.remove("hidden");
      document.querySelector("#button-text").classList.add("hidden");
    } else {
      document.querySelector("#submit").disabled = false;
      document.querySelector("#spinner").classList.add("hidden");
      document.querySelector("#button-text").classList.remove("hidden");
    }
  }

});