'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, Button, Input, Alert } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
    SUBSCRIPTION_PLANS,
    formatCurrency,
    type PlanType,
} from '@/lib/subscription/activationService';
import {
    PLAN_ORDER,
    getPlanPrices,
    loadSubscriptionPlans,
    saveSubscriptionPlanPrices,
} from '@/lib/subscription/planPricing';
import { CreditCard, Save, RotateCcw, Tag } from 'lucide-react';

const PlanPricingSettings: React.FC = () => {
    const { user } = useAuthStore();
    const toast = useToast();

    const [prices, setPrices] = useState<Record<PlanType, string>>({
        MENSAL: String(SUBSCRIPTION_PLANS.MENSAL.price),
        TRIMESTRAL: String(SUBSCRIPTION_PLANS.TRIMESTRAL.price),
        SEMESTRAL: String(SUBSCRIPTION_PLANS.SEMESTRAL.price),
        ANUAL: String(SUBSCRIPTION_PLANS.ANUAL.price),
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Carregar apenas ao montar — sem auto-refresh para não apagar edições em curso
    useEffect(() => {
        const plans = loadSubscriptionPlans();
        const loaded = getPlanPrices(plans);
        setPrices({
            MENSAL: String(loaded.MENSAL),
            TRIMESTRAL: String(loaded.TRIMESTRAL),
            SEMESTRAL: String(loaded.SEMESTRAL),
            ANUAL: String(loaded.ANUAL),
        });
    }, []);

    if (user?.role !== 'SUPERADMIN') {
        return (
            <Alert variant="error">
                Apenas o SuperAdmin pode alterar os preços das licenças.
            </Alert>
        );
    }

    const handleChange = (plan: PlanType, value: string) => {
        const cleaned = value.replace(/[^\d]/g, '');
        setPrices((prev) => ({ ...prev, [plan]: cleaned }));
        setError('');
    };

    const parsePrices = (): Record<PlanType, number> | null => {
        const parsed = {} as Record<PlanType, number>;
        for (const plan of PLAN_ORDER) {
            const num = Number(prices[plan]);
            if (!Number.isFinite(num) || prices[plan] === '' || num < 0) {
                setError(`Indique um valor válido para o plano ${SUBSCRIPTION_PLANS[plan].label}.`);
                return null;
            }
            parsed[plan] = num;
        }
        return parsed;
    };

    const handleSave = () => {
        if (!user?.organization_id) {
            toast.error('Erro', 'Organização não identificada.');
            return;
        }

        const parsed = parsePrices();
        if (!parsed) return;

        setIsSaving(true);
        try {
            saveSubscriptionPlanPrices(user.organization_id, parsed);
            toast.success('Preços actualizados', 'Os valores das licenças foram guardados com sucesso.');
        } catch (err) {
            console.error(err);
            toast.error('Erro', (err as Error).message || 'Não foi possível guardar os preços.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetDefaults = () => {
        setPrices({
            MENSAL: String(SUBSCRIPTION_PLANS.MENSAL.price),
            TRIMESTRAL: String(SUBSCRIPTION_PLANS.TRIMESTRAL.price),
            SEMESTRAL: String(SUBSCRIPTION_PLANS.SEMESTRAL.price),
            ANUAL: String(SUBSCRIPTION_PLANS.ANUAL.price),
        });
        setError('');
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <Card className="p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Tag className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Preços das Licenças</h3>
                        <p className="text-gray-600 mt-1">
                            Defina os valores (AOA) dos planos Mensal, Trimestral, Semestral e Anual.
                            Estes preços aparecem aos clientes ao solicitar activação.
                        </p>
                    </div>
                </div>

                {error && (
                    <Alert variant="error" className="mb-4">
                        {error}
                    </Alert>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                    {PLAN_ORDER.map((plan) => {
                        const meta = SUBSCRIPTION_PLANS[plan];
                        const num = Number(prices[plan]);
                        return (
                            <div
                                key={plan}
                                className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-gray-400" />
                                        <span className="font-semibold text-gray-900">{meta.label}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{meta.duration} dias</span>
                                </div>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    label="Valor (AOA)"
                                    value={prices[plan]}
                                    onChange={(e) => handleChange(plan, e.target.value)}
                                    placeholder="0"
                                />
                                <p className="text-sm font-medium text-[var(--primary)]">
                                    {Number.isFinite(num) && prices[plan] !== ''
                                        ? formatCurrency(num)
                                        : '—'}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isSaving}
                        disabled={isSaving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Preços
                    </Button>
                    <Button variant="outline" onClick={handleResetDefaults} disabled={isSaving}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar Padrão
                    </Button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    Pedidos já criados mantêm o valor original. Novos pedidos usam os preços actualizados.
                </p>
            </Card>
        </div>
    );
};

export default PlanPricingSettings;
