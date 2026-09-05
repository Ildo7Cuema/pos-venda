'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import ReportFilters, { ReportPeriod } from '@/components/reports/ReportFilters';
import SalesReport from '@/components/reports/SalesReport';
import ProductsReport from '@/components/reports/ProductsReport';
import db from '@/lib/db/sqlite';
import { downloadExcelWorkbook, excelNumber } from '@/lib/excel/exportReport';
import { useToast } from '@/components/ui/Toast';
import { ShoppingCart, Package } from 'lucide-react';

type ReportTab = 'sales' | 'products';

interface SalesData {
    date: string;
    total: number;
    count: number;
}

interface PaymentMethodData {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

interface TopProduct {
    id: string;
    name: string;
    code: string;
    quantity: number;
    revenue: number;
}

interface LowStockProduct {
    id: string;
    name: string;
    code: string;
    current_stock: number;
    min_stock: number;
}

export default function ReportsPage() {
    const { user } = useAuthStore();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<ReportTab>('sales');
    const [period, setPeriod] = useState<ReportPeriod>('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Sales Report Data
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [totalSales, setTotalSales] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [averageTicket, setAverageTicket] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);

    // Products Report Data
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [activeProducts, setActiveProducts] = useState(0);
    const [outOfStock, setOutOfStock] = useState(0);

    const getDateRange = () => {
        const now = new Date();
        let start: Date;
        const end = new Date(now);

        switch (period) {
            case 'today':
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start = new Date(now);
                start.setDate(now.getDate() - now.getDay());
                start.setHours(0, 0, 0, 0);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                return { start: startDate, end: endDate };
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    const fetchSalesData = async () => {
        if (!user?.organization_id) return;

        const { start, end } = getDateRange();

        try {
            // Sales by day
            const salesByDaySql = `
                SELECT 
                    date(sale_date) as date,
                    SUM(total_amount) as total,
                    COUNT(*) as count
                FROM sales 
                WHERE organization_id = ? 
                  AND date(sale_date) >= date(?) 
                  AND date(sale_date) <= date(?)
                GROUP BY date(sale_date)
                ORDER BY date ASC
            `;
            const salesByDay = await db.query<{ date: string; total: number; count: number }>(
                salesByDaySql, [user.organization_id, start, end]
            );
            setSalesData(salesByDay.map(d => ({
                date: new Date(d.date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }),
                total: d.total,
                count: d.count
            })));

            // Totals
            const totalsSql = `
                SELECT 
                    COUNT(*) as count,
                    COALESCE(SUM(total_amount), 0) as total
                FROM sales 
                WHERE organization_id = ? 
                  AND date(sale_date) >= date(?) 
                  AND date(sale_date) <= date(?)
            `;
            const totals = await db.queryOne<{ count: number; total: number }>(
                totalsSql, [user.organization_id, start, end]
            );
            setTotalSales(totals?.count || 0);
            setTotalRevenue(totals?.total || 0);
            setAverageTicket(totals?.count ? (totals.total / totals.count) : 0);

            // Payment methods
            const paymentSql = `
                SELECT 
                    payment_method,
                    SUM(total_amount) as total
                FROM sales 
                WHERE organization_id = ? 
                  AND date(sale_date) >= date(?) 
                  AND date(sale_date) <= date(?)
                GROUP BY payment_method
            `;
            const payments = await db.query<{ payment_method: string; total: number }>(
                paymentSql, [user.organization_id, start, end]
            );
            const colors: Record<string, string> = {
                'DINHEIRO': '#10B981',
                'TPA': '#3B82F6',
                'TRANSFERENCIA': '#F59E0B',
                'MULTICAIXA': '#EF4444',
                'OUTRO': '#8B5CF6'
            };
            setPaymentMethods(payments.map(p => ({
                name: p.payment_method,
                value: p.total,
                color: colors[p.payment_method] || '#6B7280'
            })));
        } catch (error) {
            console.error('Error fetching sales data:', error);
        }
    };

    const fetchProductsData = async () => {
        if (!user?.organization_id) return;

        const { start, end } = getDateRange();

        try {
            // Top products
            const topProductsSql = `
                SELECT 
                    si.product_id as id,
                    si.product_name as name,
                    si.product_code as code,
                    SUM(si.quantity) as quantity,
                    SUM(si.line_total) as revenue
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.organization_id = ? 
                  AND date(s.sale_date) >= date(?) 
                  AND date(s.sale_date) <= date(?)
                GROUP BY si.product_id
                ORDER BY quantity DESC
                LIMIT 10
            `;
            const top = await db.query<TopProduct>(
                topProductsSql, [user.organization_id, start, end]
            );
            setTopProducts(top);

            // Low stock
            const lowStockSql = `
                SELECT id, name, code, current_stock, min_stock
                FROM products 
                WHERE organization_id = ? 
                  AND is_active = 1
                  AND current_stock <= min_stock
                ORDER BY current_stock ASC
                LIMIT 10
            `;
            const lowStock = await db.query<LowStockProduct>(
                lowStockSql, [user.organization_id]
            );
            setLowStockProducts(lowStock);

            // Product stats
            const statsSql = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock
                FROM products 
                WHERE organization_id = ?
            `;
            const stats = await db.queryOne<{ total: number; active: number; out_of_stock: number }>(
                statsSql, [user.organization_id]
            );
            setTotalProducts(stats?.total || 0);
            setActiveProducts(stats?.active || 0);
            setOutOfStock(stats?.out_of_stock || 0);
        } catch (error) {
            console.error('Error fetching products data:', error);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'sales') {
                await fetchSalesData();
            } else {
                await fetchProductsData();
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.organization_id, activeTab, period]);

    const handleExportExcel = async () => {
        if (!user?.organization_id) {
            toast.error('Erro', 'Organização não identificada.');
            return;
        }

        const { start, end } = getDateRange();
        if (period === 'custom' && (!start || !end)) {
            toast.error('Período incompleto', 'Indique a data de início e fim antes de exportar.');
            return;
        }

        setIsExporting(true);
        try {
            if (activeTab === 'sales') {
                const saleItems = await db.query<{
                    sale_number: string;
                    sale_date: string;
                    product_code: string;
                    product_name: string;
                    quantity: number;
                    unit_price: number;
                    tax_amount: number;
                    discount_amount: number;
                    line_total: number;
                    customer_name: string | null;
                    payment_method: string;
                    seller_name: string | null;
                }>(`
                    SELECT 
                        s.sale_number,
                        s.sale_date,
                        si.product_code,
                        si.product_name,
                        si.quantity,
                        si.unit_price,
                        si.tax_amount,
                        si.discount_amount,
                        si.line_total,
                        s.customer_name,
                        s.payment_method,
                        u.full_name as seller_name
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE s.organization_id = ?
                      AND date(s.sale_date) >= date(?)
                      AND date(s.sale_date) <= date(?)
                    ORDER BY s.sale_date ASC, s.sale_number ASC, si.product_name ASC
                `, [user.organization_id, start, end]);

                const salesList = await db.query<{
                    sale_number: string;
                    sale_date: string;
                    customer_name: string | null;
                    payment_method: string;
                    subtotal: number;
                    tax_amount: number;
                    discount_amount: number;
                    total_amount: number;
                    payment_status: string;
                    seller_name: string | null;
                }>(`
                    SELECT 
                        s.sale_number,
                        s.sale_date,
                        s.customer_name,
                        s.payment_method,
                        s.subtotal,
                        s.tax_amount,
                        s.discount_amount,
                        s.total_amount,
                        s.payment_status,
                        u.full_name as seller_name
                    FROM sales s
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE s.organization_id = ?
                      AND date(s.sale_date) >= date(?)
                      AND date(s.sale_date) <= date(?)
                    ORDER BY s.sale_date ASC
                `, [user.organization_id, start, end]);

                const salesByDay = await db.query<{ date: string; total: number; count: number }>(`
                    SELECT 
                        date(sale_date) as date,
                        SUM(total_amount) as total,
                        COUNT(*) as count
                    FROM sales 
                    WHERE organization_id = ? 
                      AND date(sale_date) >= date(?) 
                      AND date(sale_date) <= date(?)
                    GROUP BY date(sale_date)
                    ORDER BY date ASC
                `, [user.organization_id, start, end]);

                const payments = await db.query<{ payment_method: string; total: number; count: number }>(`
                    SELECT 
                        payment_method,
                        SUM(total_amount) as total,
                        COUNT(*) as count
                    FROM sales 
                    WHERE organization_id = ? 
                      AND date(sale_date) >= date(?) 
                      AND date(sale_date) <= date(?)
                    GROUP BY payment_method
                `, [user.organization_id, start, end]);

                const totals = await db.queryOne<{ count: number; total: number }>(`
                    SELECT 
                        COUNT(*) as count,
                        COALESCE(SUM(total_amount), 0) as total
                    FROM sales 
                    WHERE organization_id = ? 
                      AND date(sale_date) >= date(?) 
                      AND date(sale_date) <= date(?)
                `, [user.organization_id, start, end]);

                const avg = totals?.count ? totals.total / totals.count : 0;

                downloadExcelWorkbook(
                    [
                        {
                            name: 'Resumo',
                            rows: [
                                { Indicador: 'Período início', Valor: start },
                                { Indicador: 'Período fim', Valor: end },
                                { Indicador: 'Total de vendas', Valor: excelNumber(totals?.count) },
                                { Indicador: 'Receita total (AOA)', Valor: excelNumber(totals?.total) },
                                { Indicador: 'Ticket médio (AOA)', Valor: excelNumber(avg) },
                            ],
                        },
                        {
                            name: 'Detalhe Produtos',
                            rows: saleItems.map((item) => ({
                                'Data da Venda': item.sale_date,
                                'Nº Venda': item.sale_number,
                                'Código': item.product_code,
                                'Produto': item.product_name,
                                'Quantidade': excelNumber(item.quantity),
                                'Preço Unitário (AOA)': excelNumber(item.unit_price),
                                'Desconto (AOA)': excelNumber(item.discount_amount),
                                'Imposto (AOA)': excelNumber(item.tax_amount),
                                'Total Linha (AOA)': excelNumber(item.line_total),
                                'Vendido por': item.seller_name || '—',
                                'Cliente': item.customer_name || 'Consumidor Final',
                                'Pagamento': item.payment_method,
                            })),
                        },
                        {
                            name: 'Vendas',
                            rows: salesList.map((s) => ({
                                'Nº Venda': s.sale_number,
                                'Data': s.sale_date,
                                'Cliente': s.customer_name || 'Consumidor Final',
                                'Vendido por': s.seller_name || '—',
                                'Pagamento': s.payment_method,
                                'Estado': s.payment_status,
                                'Subtotal': excelNumber(s.subtotal),
                                'Imposto': excelNumber(s.tax_amount),
                                'Desconto': excelNumber(s.discount_amount),
                                'Total (AOA)': excelNumber(s.total_amount),
                            })),
                        },
                        {
                            name: 'Por Dia',
                            rows: salesByDay.map((d) => ({
                                'Data': d.date,
                                'Nº Vendas': excelNumber(d.count),
                                'Total (AOA)': excelNumber(d.total),
                            })),
                        },
                        {
                            name: 'Pagamentos',
                            rows: payments.map((p) => ({
                                'Método': p.payment_method,
                                'Nº Vendas': excelNumber(p.count),
                                'Total (AOA)': excelNumber(p.total),
                            })),
                        },
                    ],
                    `relatorio_vendas_${start}_${end}`
                );
            } else {
                const productsSold = await db.query<TopProduct>(`
                    SELECT 
                        si.product_id as id,
                        si.product_name as name,
                        si.product_code as code,
                        SUM(si.quantity) as quantity,
                        SUM(si.line_total) as revenue
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    WHERE s.organization_id = ? 
                      AND date(s.sale_date) >= date(?) 
                      AND date(s.sale_date) <= date(?)
                    GROUP BY si.product_id
                    ORDER BY quantity DESC
                `, [user.organization_id, start, end]);

                const lowStock = await db.query<LowStockProduct>(`
                    SELECT id, name, code, current_stock, min_stock
                    FROM products 
                    WHERE organization_id = ? 
                      AND is_active = 1
                      AND current_stock <= min_stock
                    ORDER BY current_stock ASC
                `, [user.organization_id]);

                const stats = await db.queryOne<{ total: number; active: number; out_of_stock: number }>(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                        SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock
                    FROM products 
                    WHERE organization_id = ?
                `, [user.organization_id]);

                downloadExcelWorkbook(
                    [
                        {
                            name: 'Resumo',
                            rows: [
                                { Indicador: 'Período início', Valor: start },
                                { Indicador: 'Período fim', Valor: end },
                                { Indicador: 'Total produtos', Valor: excelNumber(stats?.total) },
                                { Indicador: 'Produtos activos', Valor: excelNumber(stats?.active) },
                                { Indicador: 'Sem stock', Valor: excelNumber(stats?.out_of_stock) },
                            ],
                        },
                        {
                            name: 'Produtos Vendidos',
                            rows: productsSold.map((p) => ({
                                'Código': p.code,
                                'Produto': p.name,
                                'Quantidade': excelNumber(p.quantity),
                                'Receita (AOA)': excelNumber(p.revenue),
                            })),
                        },
                        {
                            name: 'Stock Baixo',
                            rows: lowStock.map((p) => ({
                                'Código': p.code,
                                'Produto': p.name,
                                'Stock Actual': excelNumber(p.current_stock),
                                'Stock Mínimo': excelNumber(p.min_stock),
                            })),
                        },
                    ],
                    `relatorio_produtos_${start}_${end}`
                );
            }

            toast.success('Excel gerado', 'O relatório foi descarregado com sucesso.');
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            toast.error('Erro', 'Não foi possível gerar o ficheiro Excel.');
        } finally {
            setIsExporting(false);
        }
    };

    const tabs = [
        { id: 'sales' as ReportTab, label: 'Vendas', icon: ShoppingCart },
        { id: 'products' as ReportTab, label: 'Produtos', icon: Package },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                    <p className="text-gray-500">Análise de vendas e produtos.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <ReportFilters
                period={period}
                startDate={startDate}
                endDate={endDate}
                onPeriodChange={setPeriod}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onRefresh={fetchData}
                onExport={handleExportExcel}
                isLoading={isLoading || isExporting}
            />

            {/* Report Content */}
            {activeTab === 'sales' && (
                <SalesReport
                    salesData={salesData}
                    totalSales={totalSales}
                    totalRevenue={totalRevenue}
                    averageTicket={averageTicket}
                    paymentMethods={paymentMethods}
                />
            )}

            {activeTab === 'products' && (
                <ProductsReport
                    topProducts={topProducts}
                    lowStockProducts={lowStockProducts}
                    totalProducts={totalProducts}
                    activeProducts={activeProducts}
                    outOfStock={outOfStock}
                />
            )}
        </div>
    );
}
