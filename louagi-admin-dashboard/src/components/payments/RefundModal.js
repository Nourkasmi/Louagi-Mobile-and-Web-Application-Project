import React from 'react';
import { AlertTriangle, ArrowDownRight } from 'lucide-react';

const RefundModal = ({
    showRefundModal,
    selectedPayment,
    refundAmount,
    setRefundAmount,
    refundReason,
    setRefundReason,
    formatCurrency,
    handleRefund,
    onClose
}) => {
    if (!showRefundModal || !selectedPayment) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Process Refund
                    </h3>

                    <div className="space-y-4">
                        {/* Payment Details */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">Original Payment</div>
                            <div className="text-lg font-semibold text-gray-900">
                                {formatCurrency(selectedPayment.amount)}
                            </div>
                            <div className="text-sm text-gray-500">
                                Payment #{selectedPayment.id.slice(-8)}
                            </div>
                        </div>

                        {/* Refund Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Refund Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                max={selectedPayment.amount}
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                className="input-field"
                                placeholder="Enter refund amount"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                Maximum: {formatCurrency(selectedPayment.amount)}
                            </div>
                        </div>

                        {/* Refund Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Refund Reason
                            </label>
                            <select
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                className="input-field"
                            >
                                <option value="requested_by_customer">Requested by Customer</option>
                                <option value="duplicate">Duplicate Payment</option>
                                <option value="fraudulent">Fraudulent Transaction</option>
                                <option value="expired_uncaptured_charge">Expired Uncaptured Charge</option>
                            </select>
                        </div>

                        {/* Warning */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        This action cannot be undone. The refund will be processed immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleRefund}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                        >
                            <ArrowDownRight className="h-4 w-4" />
                            <span>Process Refund</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundModal;