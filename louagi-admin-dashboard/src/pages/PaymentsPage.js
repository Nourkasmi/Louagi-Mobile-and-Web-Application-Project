// src/pages/PaymentsPage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, RefreshCw } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    PaymentStatistics,
    PaymentFilters,
    PaymentTable,
    RefundModal
} from '../components/payments';
import { usePayments } from '../hooks/usePayments';
import { formatCurrency, formatDate } from '../utils/paymentHelpers';

const PaymentsPage = () => {
    const { user } = useAuth();
    const {
        loading,
        payments,
        stats,
        currentPage,
        totalPages,
        searchTerm,
        filters,
        refreshing,
        setCurrentPage,
        setSearchTerm,
        setFilters,
        refreshData,
        exportPayments,
        fetchPayments,
        fetchPaymentStats
    } = usePayments();

    // Refund modal state
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('requested_by_customer');

    const handleRefund = async () => {
        if (!selectedPayment) return;

        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch(`/api/payments/${selectedPayment.id}/refund`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: refundAmount ? parseFloat(refundAmount) : undefined,
                    reason: refundReason
                })
            });

            if (response.ok) {
                closeRefundModal();
                fetchPayments();
                fetchPaymentStats();
                alert('Refund processed successfully');
            } else {
                const errorData = await response.json();
                alert(`Refund failed: ${errorData.message}`);
            }
        } catch (error) {
            alert('Error processing refund');
        }
    };

    const openRefundModal = (payment) => {
        setSelectedPayment(payment);
        setRefundAmount(payment.amount.toString());
        setShowRefundModal(true);
    };

    const closeRefundModal = () => {
        setShowRefundModal(false);
        setSelectedPayment(null);
        setRefundAmount('');
        setRefundReason('requested_by_customer');
    };

    if (loading && payments.length === 0) {
        return (
            <div className="space-y-6">
                <PageHeader title="Payments Management" subtitle="Loading..." />
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" text="Loading payments..." />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
<PageHeader
    title="Payments Management"
    subtitle="Manage payments, refunds, and financial transactions"
    action={
        <div className="flex items-center space-x-3">
            <button
                onClick={refreshData}
                disabled={refreshing}
                className="btn-primary flex items-center space-x-2"
            >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
            </button>
        </div>
    }
/>

            <PaymentStatistics stats={stats || {}} formatCurrency={formatCurrency} />

            <PaymentFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                setFilters={setFilters}
            />

            <PaymentTable
                payments={payments}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                openRefundModal={openRefundModal}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
            />

            <RefundModal
                showRefundModal={showRefundModal}
                selectedPayment={selectedPayment}
                refundAmount={refundAmount}
                setRefundAmount={setRefundAmount}
                refundReason={refundReason}
                setRefundReason={setRefundReason}
                formatCurrency={formatCurrency}
                handleRefund={handleRefund}
                onClose={closeRefundModal}
            />
        </div>
    );
};

export default PaymentsPage;
