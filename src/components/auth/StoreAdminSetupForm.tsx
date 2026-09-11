'use client';

import { useState } from 'react';
import { Input, Button, Alert, Select } from '@/components/ui';
import { createStoreAdministrator } from '@/lib/setup/initialSetup';
import type { FiscalRegime } from '@/types';

interface StoreAdminSetupFormProps {
    onSuccess: (email: string, password: string) => Promise<void>;
    onGoToLogin?: () => void;
}

const fiscalRegimeOptions = [
    { value: 'GERAL', label: 'Regime Geral' },
    { value: 'SIMPLIFICADO', label: 'Regime Simplificado' },
    { value: 'EXCLUSAO', label: 'Regime de Exclusão' },
];

export default function StoreAdminSetupForm({ onSuccess, onGoToLogin }: StoreAdminSetupFormProps) {
    const [organizationName, setOrganizationName] = useState('');
    const [nif, setNif] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [fiscalRegime, setFiscalRegime] = useState<FiscalRegime>('GERAL');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As palavras-passe não coincidem.');
            return;
        }

        setIsSaving(true);
        try {
            createStoreAdministrator({
                organizationName,
                nif,
                phone,
                address,
                fiscalRegime,
                adminName,
                adminEmail,
                password,
            });
            await onSuccess(adminEmail.trim().toLowerCase(), password);
        } catch (err) {
            setError((err as Error).message || 'Não foi possível criar a conta.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastrar Administrador</h2>
            <p className="text-sm text-gray-600 mb-6">
                Crie a conta do administrador da loja e os dados da empresa. Depois o sistema pede as configurações iniciais, como já acontece.
            </p>

            {error && (
                <Alert variant="error" className="mb-4">
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Empresa</p>
                    <div className="space-y-4">
                        <Input
                            label="Nome da empresa / loja"
                            placeholder="Ex.: Mini Mercado Kamba"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            required
                        />
                        <Input
                            label="NIF"
                            placeholder="NIF da empresa"
                            value={nif}
                            onChange={(e) => setNif(e.target.value)}
                            required
                        />
                        <Input
                            label="Telefone"
                            placeholder="Opcional"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <Input
                            label="Morada"
                            placeholder="Opcional"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                        <Select
                            label="Regime fiscal"
                            options={fiscalRegimeOptions}
                            value={fiscalRegime}
                            onChange={(e) => setFiscalRegime(e.target.value as FiscalRegime)}
                        />
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Administrador</p>
                    <div className="space-y-4">
                        <Input
                            label="Nome completo"
                            placeholder="Nome do administrador"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            required
                        />
                        <Input
                            type="email"
                            label="Email"
                            placeholder="admin@empresa.com"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            label="Palavra-passe"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <Input
                            type="password"
                            label="Confirmar palavra-passe"
                            placeholder="Repita a palavra-passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    size="lg"
                    isLoading={isSaving}
                    disabled={isSaving}
                >
                    {isSaving ? 'A criar conta...' : 'Criar administrador e empresa'}
                </Button>
            </form>

            {onGoToLogin && (
                <p className="text-center text-sm text-gray-600 mt-6">
                    Já tem conta?{' '}
                    <button type="button" onClick={onGoToLogin} className="text-[var(--primary)] hover:underline font-medium">
                        Entrar
                    </button>
                </p>
            )}
        </>
    );
}
