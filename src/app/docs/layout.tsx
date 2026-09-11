import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentação | KAMBA Money',
  description:
    'Guia completo do KAMBA Money: ponto de venda, stock, facturação eletrónica, relatórios e conformidade com a legislação angolana.',
};

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
