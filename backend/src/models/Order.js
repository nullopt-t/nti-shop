import mongoose from 'mongoose';

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const noteEntrySchema = new mongoose.Schema(
  {
    time: {
      type: Date,
      default: Date.now,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userDetails: {
      name: {
        type: String,
        default: 'Guest Customer',
        trim: true,
      },
      phone: {
        type: String,
        default: 'N/A',
        trim: true,
      },
      address: {
        type: String,
        default: 'N/A',
        trim: true,
      },
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'paymob', 'stripe'],
      default: 'cod',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymobDetails: {
      intentionId: { type: String, default: null },
      clientSecret: { type: String, default: null },
      paymobOrderId: { type: String, default: null },
      transactionId: { type: String, default: null },
    },
    stripeDetails: {
      sessionId: { type: String, default: null },
      paymentIntentId: { type: String, default: null },
      customerEmail: { type: String, default: null },
    },
    items: {
      type: [orderItemSnapshotSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['opened', 'closed'],
      default: 'opened',
      index: true,
    },
    notes: {
      type: [noteEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model('Order', orderSchema);
