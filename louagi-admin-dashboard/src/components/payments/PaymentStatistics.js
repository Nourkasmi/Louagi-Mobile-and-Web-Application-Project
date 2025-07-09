import React from 'react';
import { DollarSign, CreditCard, ArrowDownRight, TrendingUp } from 'lucide-react';
import StatCard from '../common/StatCard';

const PaymentStatistics = ({ stats = {}, formatCurrency }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue || 0)}
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
            color="green"
        />
        <StatCard
            title="Total Payments"
            value={stats.total || 0}
            change="+8.2%"
            changeType="positive"
            icon={CreditCard}
            color="blue"
        />
        <StatCard
            title="Total Refunds"
            value={formatCurrency(stats.totalRefunds || 0)}
            change="-2.1%"
            changeType="negative"
            icon={ArrowDownRight}
            color="purple"
        />
        <StatCard
            title="Net Revenue"
            value={formatCurrency(stats.netRevenue || 0)}
            change="+15.3%"
            changeType="positive"
            icon={TrendingUp}
            color="primary"
        />
    </div>
);

export default PaymentStatistics;
