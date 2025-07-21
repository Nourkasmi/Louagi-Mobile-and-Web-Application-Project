import React from 'react';
import { ArrowDownRight, Eye } from 'lucide-react';
import { getStatusIcon, getStatusColor } from '../../utils/paymentHelpers';

const PaymentRow = ({ payment, formatCurrency, formatDate, openRefundModal }) => {
    const getMethodBadge = (method) => {
        const colors = {
            stripe: 'bg-purple-100 text-purple-800',
            stripe_refund: 'bg-red-100 text-red-800',
            cash: 'bg-green-100 text-green-800',
            bank_transfer: 'bg-blue-100 text-blue-800'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
                {method?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </span>
        );
    };

    const canRefund = payment.status === 'completed' && !payment.refunded;

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        #{payment.id?.slice(-8) || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                        {payment.booking?.bookingReference || 'No reference'}
                    </div>
                </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {payment.customer?.name || payment.booking?.passenger?.user?.username || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                        {payment.customer?.email || payment.booking?.passenger?.user?.email || 'No email'}
                    </div>
                </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                </div>
                {payment.currency && payment.currency !== 'USD' && (
                    <div className="text-sm text-gray-500">
                        {payment.currency}
                    </div>
                )}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="ml-1">{payment.status?.toUpperCase() || 'UNKNOWN'}</span>
                </span>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                {getMethodBadge(payment.method)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(payment.createdAt)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => {/* View details logic */ }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </button>

                    {canRefund && (
                        <button
                            onClick={() => openRefundModal(payment)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Process Refund"
                        >
                            <ArrowDownRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default PaymentRow;