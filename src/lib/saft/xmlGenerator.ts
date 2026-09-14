import { Invoice, Organization, Customer, Product, InvoiceItem, DocumentType } from '@/types';
import { CustomerRepository } from '@/lib/db/repositories/CustomerRepository';
import { InvoiceRepository } from '@/lib/db/repositories/InvoiceRepository';
import { ProductRepository } from '@/lib/db/repositories/ProductRepository';
import {
    SOFTWARE_PRODUCER_NIF,
    SOFTWARE_PRODUCT_ID,
    SOFTWARE_VALIDATION_NUMBER,
    SOFTWARE_VERSION,
} from '@/lib/saft/softwareIdentity';

interface SaftHeader {
    auditFileVersion: string;
    companyID: string;
    taxRegistrationNumber: string;
    taxAccountingBasis: string;
    companyName: string;
    businessName: string;
    companyAddress: {
        addressDetail: string;
        city: string;
        country: string;
    };
    fiscalYear: string;
    startDate: string;
    endDate: string;
    currencyCode: string;
    dateCreated: string;
    taxEntity: string;
    productCompanyTaxID: string;
    softwareValidationNumber: string;
    productID: string;
    productVersion: string;
}

const FISCAL_DOCUMENT_TYPES: DocumentType[] = [
    'FACTURA',
    'FACTURA_RECIBO',
    'FACTURA_SIMPLIFICADA',
    'NOTA_CREDITO',
    'NOTA_DEBITO',
];

export class SaftGenerator {

    private escapeXml(unsafe: string): string {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    private formatDate(date: string): string {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) {
            return new Date().toISOString().split('T')[0];
        }
        return d.toISOString().split('T')[0];
    }

    private formatDateTime(date: string): string {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) {
            return new Date().toISOString().slice(0, 19);
        }
        return d.toISOString().slice(0, 19);
    }

    private mapInvoiceType(type: DocumentType): string {
        const types: Record<DocumentType, string> = {
            'FACTURA': 'FT',
            'FACTURA_RECIBO': 'FR',
            'FACTURA_SIMPLIFICADA': 'FS',
            'FACTURA_PROFORMA': 'PF',
            'NOTA_CREDITO': 'NC',
            'NOTA_DEBITO': 'ND'
        };
        return types[type] || 'FT';
    }

    private customerIdFromInvoice(invoice: Invoice): string {
        const nif = (invoice.customer_nif || '').trim();
        if (!nif || nif === '999999999') return 'CF';
        return nif;
    }

    async generate(organizationId: string, startDate: string, endDate: string, organization: Organization): Promise<string> {
        const allInvoices = await InvoiceRepository.findAll(organizationId, {
            startDate,
            endDate,
            limit: 0,
        });
        const invoices = allInvoices.filter((invoice) =>
            FISCAL_DOCUMENT_TYPES.includes(invoice.document_type)
        );

        if (invoices.length === 0) {
            throw new Error(
                'Não existem facturas fiscais no período seleccionado. Emita pelo menos uma Factura, Factura-Recibo ou Factura Simplificada e volte a exportar.'
            );
        }

        const invoicesWithItems: Array<Invoice & { items: InvoiceItem[] }> = [];
        for (const invoice of invoices) {
            const items = await InvoiceRepository.findItems(invoice.id);
            invoicesWithItems.push({ ...invoice, items });
        }

        const customers = await CustomerRepository.findAll(organizationId);
        const products = await ProductRepository.findAll(organizationId);
        const masterCustomers = this.mergeCustomers(customers, invoicesWithItems);
        const masterProducts = this.mergeProducts(products, invoicesWithItems);

        const header: SaftHeader = {
            auditFileVersion: '1.01_01',
            companyID: organization.nif,
            taxRegistrationNumber: organization.nif,
            taxAccountingBasis: 'F',
            companyName: organization.name,
            businessName: organization.name,
            companyAddress: {
                addressDetail: organization.address || 'Luanda',
                city: 'Luanda',
                country: 'AO'
            },
            fiscalYear: new Date(startDate).getFullYear().toString(),
            startDate: this.formatDate(startDate),
            endDate: this.formatDate(endDate),
            currencyCode: 'AOA',
            dateCreated: this.formatDate(new Date().toISOString()),
            taxEntity: 'Global',
            productCompanyTaxID: SOFTWARE_PRODUCER_NIF,
            softwareValidationNumber: SOFTWARE_VALIDATION_NUMBER,
            productID: SOFTWARE_PRODUCT_ID,
            productVersion: SOFTWARE_VERSION
        };

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<AuditFile xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01">\n';
        xml += this.generateHeader(header);
        xml += '  <MasterFiles>\n';
        xml += this.generateCustomerMasterFiles(masterCustomers);
        xml += this.generateProductMasterFiles(masterProducts);
        xml += '  </MasterFiles>\n';
        xml += '  <SourceDocuments>\n';
        xml += this.generateSalesInvoices(invoicesWithItems);
        xml += '  </SourceDocuments>\n';
        xml += '</AuditFile>';

        return xml;
    }

    private mergeCustomers(customers: Customer[], invoices: Invoice[]): Customer[] {
        const byId = new Map<string, { id: string; name: string; nif: string; address: string }>();

        for (const c of customers) {
            const id = (c.nif || '').trim() && c.nif !== '999999999' ? c.nif!.trim() : c.id;
            byId.set(id, {
                id,
                name: c.name,
                nif: c.nif || '999999999',
                address: c.address || 'Luanda',
            });
        }

        for (const invoice of invoices) {
            const id = this.customerIdFromInvoice(invoice);
            if (!byId.has(id)) {
                byId.set(id, {
                    id,
                    name: invoice.customer_name || 'Consumidor Final',
                    nif: id === 'CF' ? '999999999' : (invoice.customer_nif || '999999999'),
                    address: invoice.customer_address || 'Luanda',
                });
            }
        }

        if (!byId.has('CF')) {
            byId.set('CF', {
                id: 'CF',
                name: 'Consumidor Final',
                nif: '999999999',
                address: 'Luanda',
            });
        }

        return Array.from(byId.values()).map((c) => ({
            id: c.id,
            organization_id: '',
            name: c.name,
            nif: c.nif,
            address: c.address,
            is_active: true,
            total_purchases: 0,
            created_at: '',
            updated_at: '',
        }));
    }

    private mergeProducts(products: Product[], invoices: Array<Invoice & { items: InvoiceItem[] }>): Product[] {
        const byCode = new Map<string, { code: string; name: string; unitType: string; group: string }>();

        for (const p of products) {
            const code = (p.code || p.id).trim();
            byCode.set(code, {
                code,
                name: p.name,
                unitType: p.unit_type === 'SERVICO' ? 'S' : 'P',
                group: (p as Product & { category_name?: string }).category_name || 'Geral',
            });
        }

        for (const invoice of invoices) {
            for (const item of invoice.items || []) {
                const code = (item.product_code || 'GERAL').trim();
                if (!byCode.has(code)) {
                    byCode.set(code, {
                        code,
                        name: item.product_name || 'Serviço',
                        unitType: 'S',
                        group: 'Geral',
                    });
                }
            }
        }

        if (byCode.size === 0) {
            byCode.set('GERAL', {
                code: 'GERAL',
                name: 'Serviços diversos',
                unitType: 'S',
                group: 'Geral',
            });
        }

        return Array.from(byCode.values()).map((p) => ({
            id: p.code,
            organization_id: '',
            code: p.code,
            name: p.name,
            unit_type: p.unitType === 'S' ? 'SERVICO' : 'UNIDADE',
            category_id: p.group,
            unit_price: 0,
            cost_price: 0,
            tax_rate: 14,
            current_stock: 0,
            min_stock: 0,
            is_active: true,
            created_at: '',
            updated_at: '',
        } as Product));
    }

    private generateHeader(h: SaftHeader): string {
        return `  <Header>
    <AuditFileVersion>${h.auditFileVersion}</AuditFileVersion>
    <CompanyID>${this.escapeXml(h.companyID)}</CompanyID>
    <TaxRegistrationNumber>${this.escapeXml(h.taxRegistrationNumber)}</TaxRegistrationNumber>
    <TaxAccountingBasis>${h.taxAccountingBasis}</TaxAccountingBasis>
    <CompanyName>${this.escapeXml(h.companyName)}</CompanyName>
    <BusinessName>${this.escapeXml(h.businessName)}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${this.escapeXml(h.companyAddress.addressDetail)}</AddressDetail>
      <City>${this.escapeXml(h.companyAddress.city)}</City>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>${h.fiscalYear}</FiscalYear>
    <StartDate>${h.startDate}</StartDate>
    <EndDate>${h.endDate}</EndDate>
    <CurrencyCode>${h.currencyCode}</CurrencyCode>
    <DateCreated>${h.dateCreated}</DateCreated>
    <TaxEntity>${h.taxEntity}</TaxEntity>
    <ProductCompanyTaxID>${h.productCompanyTaxID}</ProductCompanyTaxID>
    <SoftwareValidationNumber>${h.softwareValidationNumber}</SoftwareValidationNumber>
    <ProductID>${this.escapeXml(h.productID)}</ProductID>
    <ProductVersion>${this.escapeXml(h.productVersion)}</ProductVersion>
  </Header>\n`;
    }

    private generateCustomerMasterFiles(customers: Customer[]): string {
        let xml = '';
        for (const c of customers) {
            xml += `    <Customer>
      <CustomerID>${this.escapeXml(c.id)}</CustomerID>
      <AccountID>Desconhecido</AccountID>
      <CustomerTaxID>${this.escapeXml(c.nif || '999999999')}</CustomerTaxID>
      <CompanyName>${this.escapeXml(c.name)}</CompanyName>
      <BillingAddress>
        <AddressDetail>${this.escapeXml(c.address || 'Luanda')}</AddressDetail>
        <City>Luanda</City>
        <Country>AO</Country>
      </BillingAddress>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>\n`;
        }
        return xml;
    }

    private generateProductMasterFiles(products: Product[]): string {
        let xml = '';
        for (const p of products) {
            xml += `    <Product>
      <ProductType>${p.unit_type === 'SERVICO' ? 'S' : 'P'}</ProductType>
      <ProductCode>${this.escapeXml(p.code)}</ProductCode>
      <ProductGroup>${this.escapeXml(p.category_id || 'Geral')}</ProductGroup>
      <Description>${this.escapeXml(p.name)}</Description>
      <ProductNumberCode>${this.escapeXml(p.barcode || p.code)}</ProductNumberCode>
    </Product>\n`;
        }
        return xml;
    }

    private generateSalesInvoices(invoices: Array<Invoice & { items: InvoiceItem[] }>): string {
        let totalDebit = 0;
        let totalCredit = 0;
        let invoiceXml = '';

        for (const invoice of invoices) {
            const items = invoice.items || [];
            const isCreditNote = invoice.document_type === 'NOTA_CREDITO';

            if (isCreditNote) {
                totalDebit += invoice.total_amount;
            } else {
                totalCredit += invoice.total_amount;
            }

            invoiceXml += `      <Invoice>\n`;
            invoiceXml += `        <InvoiceNo>${this.escapeXml(invoice.invoice_number)}</InvoiceNo>\n`;
            invoiceXml += `        <DocumentStatus>\n`;
            invoiceXml += `          <InvoiceStatus>${invoice.status === 'ANULADA' ? 'A' : 'N'}</InvoiceStatus>\n`;
            invoiceXml += `          <InvoiceStatusDate>${this.formatDateTime(invoice.cancelled_at || invoice.system_entry_date || invoice.issue_date)}</InvoiceStatusDate>\n`;
            invoiceXml += `          <SourceID>${this.escapeXml(invoice.user_id || 'admin')}</SourceID>\n`;
            invoiceXml += `          <SourceBilling>P</SourceBilling>\n`;
            invoiceXml += `        </DocumentStatus>\n`;
            invoiceXml += `        <Hash>${this.escapeXml(invoice.hash || '0')}</Hash>\n`;
            invoiceXml += `        <HashControl>${this.escapeXml(invoice.hash_control || '1')}</HashControl>\n`;
            invoiceXml += `        <Period>${new Date(invoice.issue_date).getMonth() + 1}</Period>\n`;
            invoiceXml += `        <InvoiceDate>${this.formatDate(invoice.issue_date)}</InvoiceDate>\n`;
            invoiceXml += `        <InvoiceType>${this.mapInvoiceType(invoice.document_type)}</InvoiceType>\n`;
            invoiceXml += `        <SpecialRegimes>\n`;
            invoiceXml += `          <SelfBillingIndicator>0</SelfBillingIndicator>\n`;
            invoiceXml += `          <CashVATSchemeIndicator>0</CashVATSchemeIndicator>\n`;
            invoiceXml += `          <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>\n`;
            invoiceXml += `        </SpecialRegimes>\n`;
            invoiceXml += `        <SourceID>${this.escapeXml(invoice.user_id || 'admin')}</SourceID>\n`;
            invoiceXml += `        <SystemEntryDate>${this.formatDateTime(invoice.system_entry_date || invoice.issue_date)}</SystemEntryDate>\n`;
            invoiceXml += `        <CustomerID>${this.escapeXml(this.customerIdFromInvoice(invoice))}</CustomerID>\n`;

            if (items.length === 0) {
                invoiceXml += `        <Line>\n`;
                invoiceXml += `          <LineNumber>1</LineNumber>\n`;
                invoiceXml += `          <ProductCode>GERAL</ProductCode>\n`;
                invoiceXml += `          <ProductDescription>Serviços diversos</ProductDescription>\n`;
                invoiceXml += `          <Quantity>1</Quantity>\n`;
                invoiceXml += `          <UnitOfMeasure>Unid</UnitOfMeasure>\n`;
                invoiceXml += `          <UnitPrice>${invoice.total_amount.toFixed(4)}</UnitPrice>\n`;
                invoiceXml += `          <TaxPointDate>${this.formatDate(invoice.issue_date)}</TaxPointDate>\n`;
                invoiceXml += `          <Description>Serviços diversos</Description>\n`;
                invoiceXml += isCreditNote
                    ? `          <DebitAmount>${invoice.total_amount.toFixed(2)}</DebitAmount>\n`
                    : `          <CreditAmount>${invoice.total_amount.toFixed(2)}</CreditAmount>\n`;
                invoiceXml += `          <Tax>\n`;
                invoiceXml += `            <TaxType>IVA</TaxType>\n`;
                invoiceXml += `            <TaxCountryRegion>AO</TaxCountryRegion>\n`;
                invoiceXml += `            <TaxCode>${invoice.tax_amount > 0 ? 'NOR' : 'ISE'}</TaxCode>\n`;
                invoiceXml += `            <TaxPercentage>${invoice.tax_amount > 0 ? '14' : '0'}</TaxPercentage>\n`;
                invoiceXml += `          </Tax>\n`;
                invoiceXml += `          <SettlementAmount>0.00</SettlementAmount>\n`;
                invoiceXml += `        </Line>\n`;
            } else {
                items.forEach((item, index) => {
                    const lineAmount = Number(item.line_total || 0);
                    invoiceXml += `        <Line>\n`;
                    invoiceXml += `          <LineNumber>${index + 1}</LineNumber>\n`;
                    invoiceXml += `          <ProductCode>${this.escapeXml(item.product_code || 'GERAL')}</ProductCode>\n`;
                    invoiceXml += `          <ProductDescription>${this.escapeXml(item.product_name)}</ProductDescription>\n`;
                    invoiceXml += `          <Quantity>${item.quantity}</Quantity>\n`;
                    invoiceXml += `          <UnitOfMeasure>Unid</UnitOfMeasure>\n`;
                    invoiceXml += `          <UnitPrice>${Number(item.unit_price || 0).toFixed(4)}</UnitPrice>\n`;
                    invoiceXml += `          <TaxPointDate>${this.formatDate(invoice.issue_date)}</TaxPointDate>\n`;
                    invoiceXml += `          <Description>${this.escapeXml(item.description || item.product_name)}</Description>\n`;
                    invoiceXml += isCreditNote
                        ? `          <DebitAmount>${lineAmount.toFixed(2)}</DebitAmount>\n`
                        : `          <CreditAmount>${lineAmount.toFixed(2)}</CreditAmount>\n`;
                    invoiceXml += `          <Tax>\n`;
                    invoiceXml += `            <TaxType>IVA</TaxType>\n`;
                    invoiceXml += `            <TaxCountryRegion>AO</TaxCountryRegion>\n`;
                    invoiceXml += `            <TaxCode>${item.tax_rate > 0 ? 'NOR' : 'ISE'}</TaxCode>\n`;
                    invoiceXml += `            <TaxPercentage>${Number(item.tax_rate || 0)}</TaxPercentage>\n`;
                    invoiceXml += `          </Tax>\n`;
                    if (item.tax_exemption_code) {
                        invoiceXml += `          <TaxExemptionReason>${this.escapeXml(item.tax_exemption_reason || 'Isento')}</TaxExemptionReason>\n`;
                        invoiceXml += `          <TaxExemptionCode>${this.escapeXml(item.tax_exemption_code)}</TaxExemptionCode>\n`;
                    }
                    invoiceXml += `          <SettlementAmount>${Number(item.discount_amount || 0).toFixed(2)}</SettlementAmount>\n`;
                    invoiceXml += `        </Line>\n`;
                });
            }

            const netTotal = Number(invoice.total_amount || 0) - Number(invoice.tax_amount || 0);
            invoiceXml += `        <DocumentTotals>\n`;
            invoiceXml += `          <TaxPayable>${Number(invoice.tax_amount || 0).toFixed(2)}</TaxPayable>\n`;
            invoiceXml += `          <NetTotal>${netTotal.toFixed(2)}</NetTotal>\n`;
            invoiceXml += `          <GrossTotal>${Number(invoice.total_amount || 0).toFixed(2)}</GrossTotal>\n`;
            invoiceXml += `        </DocumentTotals>\n`;
            invoiceXml += `      </Invoice>\n`;
        }

        let xml = '    <SalesInvoices>\n';
        xml += `      <NumberOfEntries>${invoices.length}</NumberOfEntries>\n`;
        xml += `      <TotalDebit>${totalDebit.toFixed(2)}</TotalDebit>\n`;
        xml += `      <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>\n`;
        xml += invoiceXml;
        xml += '    </SalesInvoices>\n';
        return xml;
    }
}
