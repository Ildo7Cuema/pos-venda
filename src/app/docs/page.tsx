'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const SECTIONS = [
  { id: 'introducao', label: 'Introdução' },
  { id: 'inicio', label: 'Primeiros passos' },
  { id: 'pos', label: 'Ponto de Venda' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'stock', label: 'Stock' },
  { id: 'facturacao', label: 'Facturação' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'configuracoes', label: 'Configurações' },
  { id: 'permissoes', label: 'Utilizadores' },
  { id: 'assinatura', label: 'Assinatura' },
  { id: 'conformidade', label: 'Conformidade' },
  { id: 'faq', label: 'Perguntas frequentes' },
] as const;

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function DocsPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('scroll-smooth');
    return () => document.documentElement.classList.remove('scroll-smooth');
  }, []);

  useEffect(() => {
    const headings = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (id: string) => {
    setActiveId(id);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="KAMBA Many" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">KAMBA Many</h1>
              <p className="text-xs text-gray-500">Documentação</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden btn-outline px-3 py-2 text-sm"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="docs-nav"
            >
              Índice
            </button>
            <Link href="/login" className="btn-primary">
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <section className="container pt-12 pb-6">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-semibold mb-4">
            Guia do utilizador
          </p>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Como usar o KAMBA Many</h2>
          <p className="text-lg text-gray-600">
            Manual prático para vender, controlar stock, emitir facturas e manter o negócio em conformidade
            com a legislação angolana — mesmo sem internet.
          </p>
        </div>
      </section>

      <div className="container pb-20">
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside
            id="docs-nav"
            className={`${menuOpen ? 'block' : 'hidden'} lg:block mb-8 lg:mb-0 lg:sticky lg:top-24 lg:self-start`}
          >
            <nav className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Conteúdo
              </p>
              <ul className="space-y-0.5">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={() => handleNavClick(section.id)}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        activeId === section.id
                          ? 'bg-red-50 text-[var(--primary)] font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="space-y-10 text-gray-700 leading-relaxed">
            <section id="introducao" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Introdução</h3>
              <p className="mb-4">
                O <strong>KAMBA Many</strong> é um sistema de ponto de venda, gestão de stock e facturação
                eletrónica pensado para comerciantes em Angola. Os dados ficam no computador (SQLite) e o
                sistema continua a funcionar sem ligação à internet.
              </p>
              <ul className="space-y-2">
                {[
                  'Vendas rápidas no POS com scanner de códigos de barras',
                  'Facturas fiscais com numeração, hash e ATCUD',
                  'Controlo de stock, alertas e histórico de movimentos',
                  'Relatórios de vendas e produtos, com exportação para Excel',
                  'Licença por planos (mensal, trimestral, semestral e anual)',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="inicio" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Primeiros passos</h3>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Abra o sistema e clique em <strong>Entrar</strong>. Use o email e a palavra-passe fornecidos
                  pelo administrador.
                </li>
                <li>
                  No primeiro acesso, preencha os dados da empresa em{' '}
                  <strong>Configurações → Organização</strong> (nome, NIF, morada e contactos). Estes dados
                  aparecem nas facturas.
                </li>
                <li>
                  Cadastre categorias e produtos em <strong>Produtos</strong>, com preço, IVA e stock inicial.
                </li>
                <li>
                  Confirme a impressora em <strong>Configurações → Impressora</strong> se for usar talão
                  térmico de 80 mm.
                </li>
                <li>
                  Vá a <strong>POS</strong> e faça a primeira venda de teste.
                </li>
              </ol>
              <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-900 text-sm">
                Sem uma licença activa, o sistema bloqueia operações de venda e facturação. Veja a secção{' '}
                <a href="#assinatura" className="font-semibold underline">
                  Assinatura
                </a>
                .
              </div>
            </section>

            <section id="pos" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ponto de Venda (POS)</h3>
              <p className="mb-4">
                O POS é o ecrã de venda rápida. Pesquise o produto, use o scanner ou clique no cartão para
                adicionar ao carrinho.
              </p>
              <h4 className="font-semibold text-gray-900 mb-2">Como concluir uma venda</h4>
              <ol className="list-decimal pl-5 space-y-2 mb-5">
                <li>Adicione os artigos e ajuste as quantidades no carrinho.</li>
                <li>Opcionalmente associe um cliente (obrigatório para valores elevados).</li>
                <li>
                  Clique em finalizar e escolha o método de pagamento: dinheiro, TPA, transferência ou
                  Multicaixa Express.
                </li>
                <li>
                  Escolha o documento: Factura-Recibo (pagamento imediato), Factura ou Factura Simplificada.
                </li>
                <li>Confirme. A factura é gerada e pode ser impressa de imediato.</li>
              </ol>
              <p>
                O IVA e os totais são calculados automaticamente. O stock baixa no momento da venda.
              </p>
            </section>

            <section id="produtos" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Produtos</h3>
              <p className="mb-4">
                Em <strong>Produtos</strong> gere o catálogo: código interno, código de barras, nome, categoria,
                preço, taxa de IVA e stock mínimo.
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <CheckIcon />
                  <span>Use códigos de barras para acelerar o POS com scanner.</span>
                </li>
                <li className="flex gap-2">
                  <CheckIcon />
                  <span>Defina stock mínimo para receber alertas antes de faltar mercadoria.</span>
                </li>
                <li className="flex gap-2">
                  <CheckIcon />
                  <span>Categorias organizam o ecrã de vendas e os relatórios.</span>
                </li>
              </ul>
            </section>

            <section id="stock" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Gestão de stock</h3>
              <p className="mb-4">
                A área de <strong>Stock</strong> mostra alertas de stock baixo e o histórico de entradas e
                saídas.
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Entrada de stock:</strong> use <em>Registar Entrada</em> quando receber mercadoria do
                  fornecedor.
                </li>
                <li>
                  <strong>Saídas:</strong> as vendas no POS descontam automaticamente as quantidades.
                </li>
                <li>
                  <strong>Alertas:</strong> produtos abaixo do mínimo aparecem em destaque para reposição.
                </li>
              </ul>
            </section>

            <section id="facturacao" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Facturação eletrónica</h3>
              <p className="mb-4">
                As vendas geram documentos automaticamente. Em <strong>Facturas</strong> consulta, imprime,
                emite notas e acompanha a numeração.
              </p>
              <div className="overflow-x-auto mb-5">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="border border-gray-200 px-3 py-2 font-semibold">Documento</th>
                      <th className="border border-gray-200 px-3 py-2 font-semibold">Código</th>
                      <th className="border border-gray-200 px-3 py-2 font-semibold">Quando usar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Factura-Recibo', 'FR', 'Pagamento no acto da venda'],
                      ['Factura', 'FT', 'Venda a prazo ou com pagamento posterior'],
                      ['Factura Simplificada', 'FS', 'Operações de valor reduzido'],
                      ['Factura Proforma', 'PF', 'Orçamento sem valor fiscal'],
                      ['Nota de Crédito', 'NC', 'Anular ou reduzir uma factura'],
                      ['Nota de Débito', 'ND', 'Aumentar valores de uma factura'],
                    ].map(([doc, code, use]) => (
                      <tr key={code}>
                        <td className="border border-gray-200 px-3 py-2">{doc}</td>
                        <td className="border border-gray-200 px-3 py-2 font-mono">{code}</td>
                        <td className="border border-gray-200 px-3 py-2">{use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Cada documento fiscal recebe numeração sequencial, data e hora, hash e código ATCUD. Documentos
                fiscais não podem ser alterados depois de emitidos — use nota de crédito ou débito para
                correcções.
              </p>
            </section>

            <section id="clientes" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Clientes</h3>
              <p>
                Cadastre nome, NIF, morada e contactos. Associe o cliente na venda para que os dados saiam na
                factura. Para valores acima de <strong>10.000 Kz</strong>, o NIF do adquirente é obrigatório
                por lei.
              </p>
            </section>

            <section id="relatorios" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Relatórios</h3>
              <p className="mb-4">
                Em <strong>Relatórios</strong> analise o desempenho do negócio por período: hoje, semana, mês,
                ano ou intervalo personalizado.
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Vendas:</strong> totais, número de vendas, ticket médio e métodos de pagamento.
                </li>
                <li>
                  <strong>Produtos:</strong> mais vendidos, stock baixo, produtos activos e rupturas.
                </li>
                <li>
                  <strong>Excel:</strong> exporte o relatório visível para partilhar com a contabilidade.
                </li>
              </ul>
            </section>

            <section id="configuracoes" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Configurações</h3>
              <p className="mb-4">Disponível para administradores. As opções principais:</p>
              <ul className="grid sm:grid-cols-2 gap-3">
                {[
                  ['Organização', 'Dados fiscais da empresa nas facturas'],
                  ['Assinatura', 'Estado da licença e pedido de activação'],
                  ['Categorias', 'Grupos de produtos para o POS'],
                  ['Utilizadores', 'Contas, funções e acessos'],
                  ['Impressora', 'Talão térmico POS 80 mm'],
                  ['Fiscal / SAF-T', 'Exportação do ficheiro de auditoria'],
                ].map(([title, desc]) => (
                  <li key={title} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section id="permissoes" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Utilizadores e permissões</h3>
              <p className="mb-4">Cada conta tem uma função. O que cada uma pode fazer:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="border border-gray-200 px-3 py-2 font-semibold">Função</th>
                      <th className="border border-gray-200 px-3 py-2 font-semibold">Acesso típico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Administrador', 'Tudo: produtos, stock, utilizadores e configurações'],
                      ['Gestor', 'Vendas, stock, relatórios e cadastros (sem eliminar facturas)'],
                      ['Caixa', 'POS, consulta de produtos, clientes e facturas'],
                      ['Consulta', 'Dashboard, listagens e relatórios, sem alterar dados'],
                    ].map(([role, access]) => (
                      <tr key={role}>
                        <td className="border border-gray-200 px-3 py-2 font-medium">{role}</td>
                        <td className="border border-gray-200 px-3 py-2">{access}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="assinatura" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Assinatura e activação</h3>
              <p className="mb-4">
                O acesso completo depende de uma licença válida. Os planos disponíveis são mensal, trimestral,
                semestral e anual.
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>
                  Em <strong>Configurações → Assinatura</strong> gere uma referência de pagamento (formato{' '}
                  <code className="text-sm bg-gray-100 px-1 rounded">REF-XXXXXX</code>).
                </li>
                <li>Efectue o pagamento pelos dados bancários indicados no ecrã.</li>
                <li>
                  Envie o comprovativo e a referência por WhatsApp ou email de suporte. O administrador gera o
                  código de activação.
                </li>
                <li>Introduza o código no sistema para desbloquear o período contratado.</li>
              </ol>
              <p className="text-sm text-gray-500">
                Quando a licença expira, o sistema avisa e bloqueia vendas até nova activação. Os dados já
                gravados não se perdem.
              </p>
            </section>

            <section id="conformidade" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Conformidade legal</h3>
              <p className="mb-4">
                O KAMBA Many está alinhado com o Decreto Executivo n.º 74/19 e o Decreto Presidencial n.º
                71/25 (facturação eletrónica em Angola).
              </p>
              <ul className="space-y-2 mb-4">
                {[
                  'Numeração sequencial por série e tipo de documento',
                  'IVA à taxa normal de 14%',
                  'Hash / assinatura eletrónica e código ATCUD',
                  'Exportação SAF-T para auditoria',
                  'Documentos fiscais imutáveis, com arquivo previsto para 10 anos',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500">
                Transacções acima de 25.000.000 Kz exigem factura eletrónica. Facturas devem ser emitidas até 5
                dias após o facto tributário (ou até 1 mês em operações contínuas).
              </p>
            </section>

            <section id="faq" className="card scroll-mt-28">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Perguntas frequentes</h3>
              <dl className="space-y-5">
                <div>
                  <dt className="font-semibold text-gray-900">O sistema precisa de internet?</dt>
                  <dd className="mt-1">
                    Não para vender, facturar ou gerir stock. A internet só é necessária para sincronização
                    (quando configurada) e para comunicar a activação da licença.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Posso apagar uma factura emitida?</dt>
                  <dd className="mt-1">
                    Não. Documentos fiscais são imutáveis. Use uma Nota de Crédito para anular ou reduzir, ou
                    uma Nota de Débito para acrescer valores, sempre com o motivo e a referência ao documento
                    original.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">A impressora não imprime. O que fazer?</dt>
                  <dd className="mt-1">
                    Confirme o modelo 80 mm, a ligação USB/rede e as definições em Configurações → Impressora.
                    Teste uma reimpressão a partir da factura.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Como obtenho o ficheiro SAF-T?</dt>
                  <dd className="mt-1">
                    Um administrador acede a Configurações → Fiscal / SAF-T, escolhe o período e exporta o
                    ficheiro para a contabilidade ou para a AGT.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Esqueci a palavra-passe.</dt>
                  <dd className="mt-1">
                    Na página de login use Recuperar palavra-passe, ou peça ao administrador para redefinir a
                    conta.
                  </dd>
                </div>
              </dl>
            </section>

            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">Precisa de ajuda?</p>
                <p className="text-sm text-gray-600">A nossa equipa responde por email em horário comercial.</p>
              </div>
              <a href="mailto:ildocuema@gmail.com" className="btn-primary">
                Contactar suporte
              </a>
            </div>
          </article>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-white/80">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">© 2026 KAMBA Many. Desenvolvido para Angola 🇦🇴</div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/" className="hover:text-[var(--primary)]">
                Início
              </Link>
              <a href="mailto:ildocuema@gmail.com" className="hover:text-[var(--primary)]">
                Suporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
