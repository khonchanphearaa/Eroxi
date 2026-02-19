import mongoose from 'mongoose';

const bakongTransactionSchema = new mongoose.Schema(
    {
        md5Hash: { type: String, required: true, index: true },
        qrString: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, enum: ['KHR', 'USD'], default: 'KHR' },
        description: { type: String },
        status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT'], default: 'PENDING' },
        expiresAt: { type: Date, required: true },
        paymentData: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { timestamps: true }
);

export default mongoose.model('BakongTransaction', bakongTransactionSchema);