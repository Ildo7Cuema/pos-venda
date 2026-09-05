/**
 * Preços das licenças — defaults + overrides em system_settings
 */

import db from '@/lib/db/sqlite';
import {
    SUBSCRIPTION_PLANS,
    formatCurrency,
    type PlanType,
} from '@/lib/subscription/activationService';

export const PLAN_PRICING_SETTING_KEY = 'subscription_plans';

export type PlanDefinition = {
    label: string;
    price: number;
    duration: number;
    description: string;
};

export type SubscriptionPlansMap = Record<PlanType, PlanDefinition>;

export type PlanPriceOverrides = Partial<Record<PlanType, number>>;

const PLAN_ORDER: PlanType[] = ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];

function buildDescription(planType: PlanType, price: number, monthlyPrice: number): string {
    switch (planType) {
        case 'MENSAL':
            return '1 mês de acesso completo';
        case 'TRIMESTRAL': {
            const savings = monthlyPrice * 3 - price;
            return savings > 0
                ? `3 meses de acesso (economia de ${formatCurrency(savings)})`
                : '3 meses de acesso completo';
        }
        case 'SEMESTRAL': {
            const savings = monthlyPrice * 6 - price;
            return savings > 0
                ? `6 meses de acesso (economia de ${formatCurrency(savings)})`
                : '6 meses de acesso completo';
        }
        case 'ANUAL': {
            const savings = monthlyPrice * 12 - price;
            return savings > 0
                ? `12 meses de acesso (economia de ${formatCurrency(savings)})`
                : '12 meses de acesso completo';
        }
    }
}

/**
 * Constrói o mapa de planos a partir de preços (defaults + overrides)
 */
export function buildSubscriptionPlans(overrides: PlanPriceOverrides = {}): SubscriptionPlansMap {
    const monthlyPrice = overrides.MENSAL ?? SUBSCRIPTION_PLANS.MENSAL.price;

    const plans = {} as SubscriptionPlansMap;
    for (const type of PLAN_ORDER) {
        const base = SUBSCRIPTION_PLANS[type];
        const price = overrides[type] ?? base.price;
        plans[type] = {
            label: base.label,
            price,
            duration: base.duration,
            description: buildDescription(type, price, monthlyPrice),
        };
    }
    return plans;
}

/**
 * Carrega preços guardados (globais) e devolve planos prontos a usar
 */
export function loadSubscriptionPlans(): SubscriptionPlansMap {
    try {
        const row = db.queryOne<{ setting_value: string }>(
            `SELECT setting_value FROM system_settings
             WHERE setting_key = ?
             ORDER BY updated_at DESC
             LIMIT 1`,
            [PLAN_PRICING_SETTING_KEY]
        );

        if (row?.setting_value) {
            const parsed = JSON.parse(row.setting_value) as PlanPriceOverrides;
            return buildSubscriptionPlans(parsed);
        }
    } catch (error) {
        console.error('Erro ao carregar preços das licenças:', error);
    }

    return buildSubscriptionPlans();
}

/**
 * Extrai só os preços do mapa de planos
 */
export function getPlanPrices(plans: SubscriptionPlansMap): Record<PlanType, number> {
    return {
        MENSAL: plans.MENSAL.price,
        TRIMESTRAL: plans.TRIMESTRAL.price,
        SEMESTRAL: plans.SEMESTRAL.price,
        ANUAL: plans.ANUAL.price,
    };
}

/**
 * Guarda overrides de preço (valores em AOA) sob a organização do SuperAdmin
 */
export function saveSubscriptionPlanPrices(
    organizationId: string,
    prices: Record<PlanType, number>
): void {
    for (const type of PLAN_ORDER) {
        const value = prices[type];
        if (!Number.isFinite(value) || value < 0) {
            throw new Error(`Preço inválido para o plano ${SUBSCRIPTION_PLANS[type].label}`);
        }
    }

    const payload: PlanPriceOverrides = {
        MENSAL: Math.round(prices.MENSAL),
        TRIMESTRAL: Math.round(prices.TRIMESTRAL),
        SEMESTRAL: Math.round(prices.SEMESTRAL),
        ANUAL: Math.round(prices.ANUAL),
    };

    const value = JSON.stringify(payload);

    db.run(
        `
        INSERT INTO system_settings (id, organization_id, setting_key, setting_value, setting_type, description, created_at, updated_at)
        VALUES (
            COALESCE(
                (SELECT id FROM system_settings WHERE organization_id = ? AND setting_key = ?),
                lower(hex(randomblob(16)))
            ),
            ?,
            ?,
            ?,
            'JSON',
            'Preços das licenças (Mensal, Trimestral, Semestral, Anual)',
            datetime('now'),
            datetime('now')
        )
        ON CONFLICT(organization_id, setting_key) DO UPDATE SET
            setting_value = excluded.setting_value,
            updated_at = datetime('now')
    `,
        [
            organizationId,
            PLAN_PRICING_SETTING_KEY,
            organizationId,
            PLAN_PRICING_SETTING_KEY,
            value,
        ]
    );
}

export { PLAN_ORDER };
