import React from 'react';
import { DollarSign, CreditCard, ArrowDownRight, TrendingUp } from 'lucide-react';
import StatCard from '../common/StatCard';

const PaymentStatistics = ({ stats = {}, formatCurrency }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue || 0)}
            icon={DollarSign}
            color="green"
        />
        <StatCard
            title="Total Payments"
            value={stats.total || 0}
            icon={CreditCard}
            color="blue"
        />
        <StatCard
            title="Total Refunds"
            value={formatCurrency(stats.totalRefunds || 0)}
            icon={ArrowDownRight}
            color="purple"
        />
        <StatCard
            title="Net Revenue"
            value={formatCurrency(stats.netRevenue || 0)}
            icon={TrendingUp}
            color="primary"
        />
    </div>
);

export default PaymentStatistics;
