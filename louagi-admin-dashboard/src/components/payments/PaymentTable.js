// src/components/payments/PaymentTable.js
import React from 'react';
import { CreditCard } from 'lucide-react';
import PaymentRow from './PaymentRow';

const PaymentTable = ({
    payments,
    formatCurrency,
    formatDate,
    openRefundModal,
    currentPage,
    totalPages,
    setCurrentPage
}) => (
    <div className="card">
        <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
                Payment Transactions ({payments.length})
            </h3>
        </div>

        {payments.length === 0 ? (
            <div className="p-8 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payments found</p>
                <p className="text-sm text-gray-400 mt-1">
                    Payment transactions will appear here when customers make bookings
                </p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                            <PaymentRow
                                key={payment.id}
                                payment={payment}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                                openRefundModal={openRefundModal}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        )}
    </div>
);

export default PaymentTable;