import mongoose, { Types } from 'mongoose';

export const STATUS = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
}

/* Define transaction with mongoose ORM */
const transactionSchema = new mongoose.Schema({
    qrString: { type: String, required: true },
    md5Hash: { type: String, required: true, index: true, unique: true },
    amount: { type: Number, default: null },
    currency: { type: String },
    description: { type: String, default: '' },

    /* Example: Bakong account personal OR account merchant */
    type: { type: String },
    merchantName: { type: String },
    merchantCity: { type: String },
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.PENDING
    },
    expiresAt: { type: Date },
    paymentData: { type: Object, default: null },
}, {
    /* Automatically add createdAt and updatedAt timestamps */
    timestamps: true 
})

const Transaction = mongoose.model('Transaction', transactionSchema);

/**
 * 
 * @FunctionHelpper For handle database transaction
 *  
 */

export async function create(data) {
    return await Transaction.create(data);
}

export async function findById(id) {
    return await Transaction.findById(id);
}

export async function findByMd5(md5Hash) {
    return await Transaction.findOne({ md5Hash });
}

export async function updateStatus(id, status, paymentData = null){
    return await Transaction.findByIdAndUpdate(
        id,
        {status, paymentData},

        /* Return this new:true for update document */
        {new: true}
    )
} 

export async function getAll(status=null) {
    const query = status?{status} : {};
    return await Transaction.find(query).sort({createdAt: -1});
}

export default { Transaction, create, findById, findByMd5, updateStatus, getAll, STATUS };