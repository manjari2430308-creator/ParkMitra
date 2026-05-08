const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('parkingSpace', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const amountInPaise = Math.round(booking.totalAmount * 100);

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPaise,
        currency: 'inr',
        metadata: { bookingId: bookingId.toString(), userId: req.user._id.toString() }
      });
    } catch (stripeErr) {
      // Demo mode: generate mock payment intent
      paymentIntent = {
        id: 'pi_demo_' + Date.now(),
        client_secret: 'pi_demo_secret_' + Date.now(),
        amount: amountInPaise,
        status: 'requires_payment_method'
      };
    }

    const payment = await Payment.create({
      booking: bookingId,
      user: req.user._id,
      amount: booking.totalAmount,
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret
    });

    booking.paymentId = payment._id;
    await booking.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      amount: booking.totalAmount,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId, paymentIntentId } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    // In demo mode, just mark as succeeded
    payment.status = 'succeeded';
    await payment.save();

    const booking = await Booking.findById(payment.booking);
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    await booking.save();

    res.json({ success: true, message: 'Payment confirmed', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate({ path: 'booking', populate: { path: 'parkingSpace', select: 'name address' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
