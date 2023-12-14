const express = require("express");
const app = express();
const env = require('dotenv').config({path: './.env'});
// This is a public sample test API key.
// Don’t submit any personally identifiable information in requests made with this key.
// Sign in to see your own test API key embedded in code samples.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(express.static("public"));
app.use(express.json());

const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};

app.get('/config', (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "jpy",
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

const PAYPAY = require('@paypayopa/paypayopa-sdk-node');
PAYPAY.Configure({
  clientId: process.env.API_KEY,
  clientSecret: process.env.API_SECRET,
  merchantId: process.env.MERCHANT_ID,
  productionMode: false
});
const uuid = require('uuid');


app.post('/create-paypay', async (req, res) => {
  const paymentId = uuid.v4();
  const payload = {
      merchantPaymentId: paymentId,
      amount: { "amount":3000, "currency": "JPY" },
      codeType: 'ORDER_QR',
      orderItems: null,
      redirectUrl: "http://localhost:4242/checkout.html",
      redirectType: 'WEB_LINK',
  };
  console.log(payload);

  PAYPAY.QRCodeCreate(payload, (ppResonse) => {
    const body = ppResonse.BODY;
    res.send({ url: body.data.url});
  });


});

app.listen(4242, () => console.log("Node server listening on port 4242!"));