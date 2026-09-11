import db from '@/lib/db/sqlite';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import type { FiscalRegime } from '@/types';

export interface StoreAdminSetupInput {
    organizationName: string;
    nif: string;
    address?: string;
    phone?: string;
    organizationEmail?: string;
    fiscalRegime?: FiscalRegime;
    adminName: string;
    adminEmail: string;
    password: string;
}

function hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
}

export function needsStoreAdminSetup(): boolean {
    const result = db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM users WHERE UPPER(role) = 'ADMIN'`
    );
    return !result || Number(result.count) === 0;
}

export function createStoreAdministrator(input: StoreAdminSetupInput): void {
    const organizationName = input.organizationName.trim();
    const nif = input.nif.trim();
    const adminName = input.adminName.trim();
    const adminEmail = input.adminEmail.trim().toLowerCase();
    const fiscalRegime = input.fiscalRegime || 'GERAL';

    if (!organizationName || !nif) {
        throw new Error('Nome da empresa e NIF são obrigatórios.');
    }
    if (!adminName || !adminEmail) {
        throw new Error('Nome e email do administrador são obrigatórios.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        throw new Error('Email do administrador inválido.');
    }
    if (!input.password || input.password.length < 6) {
        throw new Error('A palavra-passe deve ter pelo menos 6 caracteres.');
    }

    const existingAdmin = db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM users WHERE UPPER(role) = 'ADMIN'`
    );
    if (existingAdmin && Number(existingAdmin.count) > 0) {
        throw new Error('Já existe um administrador da empresa. Use o ecrã de entrada.');
    }

    const existingEmail = db.queryOne<{ id: string }>(
        `SELECT id FROM users WHERE lower(email) = ?`,
        [adminEmail]
    );
    if (existingEmail) {
        throw new Error('Já existe um utilizador com este email.');
    }

    const existingNif = db.queryOne<{ id: string }>(
        `SELECT id FROM organizations WHERE nif = ?`,
        [nif]
    );
    if (existingNif) {
        throw new Error('Já existe uma empresa com este NIF.');
    }

    const organizationId = uuidv4();
    const userId = uuidv4();

    try {
        db.run(
            `INSERT INTO organizations (id, name, nif, address, phone, email, fiscal_regime, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
            [
                organizationId,
                organizationName,
                nif,
                input.address?.trim() || null,
                input.phone?.trim() || null,
                input.organizationEmail?.trim() || adminEmail,
                fiscalRegime,
            ]
        );

        db.run(
            `INSERT INTO users (id, organization_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'ADMIN', 1, datetime('now'), datetime('now'))`,
            [
                userId,
                organizationId,
                adminEmail,
                hashPassword(input.password),
                adminName,
            ]
        );
    } catch (error) {
        try {
            db.run(`DELETE FROM users WHERE id = ?`, [userId]);
            db.run(`DELETE FROM organizations WHERE id = ?`, [organizationId]);
        } catch {
            /* ignore rollback helpers */
        }
        throw error;
    }
}
