import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentação | KAMBA Many',
  description:
    'Guia completo do KAMBA Many: ponto de venda, stock, facturação eletrónica, relatórios e conformidade com a legislação angolana.',
};

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
