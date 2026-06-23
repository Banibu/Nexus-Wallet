{
  "design_system_name": "Nexus Wallet (Fintech Crypto) — PT-BR",
  "brand_attributes": [
    "confiável",
    "auditável",
    "preciso",
    "fintech-grade",
    "minimalista",
    "orientado a dados"
  ],
  "visual_personality": {
    "direction": "Dark premium (sem neon exagerado), com superfícies sólidas e acentos teal + lime controlados. Layout tipo exchange (Binance) + clareza fintech (Mercado Bitcoin/Foxbit).",
    "do_not": [
      "Não usar roxo.",
      "Não usar fundos transparentes com fonte escura.",
      "Não usar gradientes escuros/saturados (roxo/rosa etc).",
      "Não centralizar o container global do app.",
      "Não usar transition: all."
    ]
  },
  "inspiration_refs": {
    "notes": "Misturar estrutura de dashboard cripto (cards + tabelas + ações rápidas) com tipografia limpa e estados de sistema bem definidos.",
    "urls": [
      "https://dribbble.com/search/crypto-dashboard",
      "https://dribbble.com/search/wallet-dashboard-ui",
      "https://dribbble.com/search/binance-dashboard",
      "https://www.behance.net/search/projects/cryptocurrency%20dashboard",
      "https://www.figma.com/community/file/1520387975145229622/crypto-wallet-dashboard-clean-ui-concept",
      "https://www.figma.com/community/file/1458452537474290364/binance-mobile-banking-app-ui-kit-crypto-finance-wallet-dashboard"
    ]
  },
  "typography": {
    "google_fonts_import": "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');",
    "font_pairing": {
      "display": "Space Grotesk",
      "body": "Inter",
      "mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    },
    "scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg text-muted-foreground",
      "section_title": "text-lg sm:text-xl font-semibold",
      "body": "text-sm sm:text-base",
      "small": "text-xs text-muted-foreground",
      "numeric": "tabular-nums"
    }
  },
  "color_system": {
    "mode": "dark-first",
    "tokens_css": {
      "where": "/app/frontend/src/index.css (substituir tokens :root e .dark para este tema)",
      "css_variables": {
        "--background": "210 20% 6%",
        "--foreground": "210 20% 98%",
        "--card": "210 18% 9%",
        "--card-foreground": "210 20% 98%",
        "--popover": "210 18% 9%",
        "--popover-foreground": "210 20% 98%",
        "--primary": "173 78% 36%",
        "--primary-foreground": "210 20% 98%",
        "--secondary": "215 16% 16%",
        "--secondary-foreground": "210 20% 98%",
        "--muted": "215 16% 16%",
        "--muted-foreground": "215 14% 70%",
        "--accent": "173 40% 18%",
        "--accent-foreground": "210 20% 98%",
        "--destructive": "0 72% 52%",
        "--destructive-foreground": "210 20% 98%",
        "--border": "215 16% 18%",
        "--input": "215 16% 18%",
        "--ring": "173 78% 36%",
        "--radius": "0.75rem",
        "--chart-1": "173 78% 36%",
        "--chart-2": "84 85% 55%",
        "--chart-3": "210 12% 70%",
        "--chart-4": "28 90% 60%",
        "--chart-5": "200 85% 55%",
        "--nexus-lime": "84 85% 55%",
        "--nexus-teal": "173 78% 36%",
        "--nexus-ink": "210 20% 6%",
        "--nexus-surface": "210 18% 9%",
        "--nexus-surface-2": "215 16% 16%"
      }
    },
    "semantic_usage": {
      "success": "usar --nexus-lime para badges/ícones/valores positivos (não para parágrafos)",
      "warning": "usar chart-4 (laranja) para alertas de risco/atenção",
      "info": "usar chart-5 (azul) para estados informativos",
      "neutral": "muted/muted-foreground para labels e metadados"
    },
    "gradients": {
      "rule": "Gradiente só como overlay decorativo em áreas grandes (hero/topo) e no máximo 20% do viewport.",
      "allowed_examples": [
        "radial-gradient(900px circle at 20% 0%, hsla(173,78%,36%,0.18), transparent 55%)",
        "radial-gradient(700px circle at 80% 10%, hsla(84,85%,55%,0.10), transparent 60%)"
      ]
    },
    "texture": {
      "noise_overlay": "usar pseudo-elemento com background-image (noise png) OU imagem leve aplicada no topo com opacity 0.06–0.10",
      "recommended_opacity": "0.08"
    }
  },
  "spacing_and_layout": {
    "spacing_scale_px": [
      4,
      8,
      12,
      16,
      24,
      32,
      48
    ],
    "container": {
      "desktop": "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8",
      "page_vertical": "py-6 sm:py-8"
    },
    "grid": {
      "dashboard": "grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6",
      "cards_row": "grid grid-cols-1 sm:grid-cols-3 gap-4",
      "two_col_form": "grid grid-cols-1 md:grid-cols-2 gap-4"
    },
    "radii_and_shadows": {
      "radius": "rounded-xl (cards), rounded-lg (inputs/buttons)",
      "shadow": "shadow-[0_10px_30px_rgba(0,0,0,0.35)] para cards principais; evitar sombras fortes em tabelas"
    }
  },
  "component_path": {
    "shadcn_primary": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/card.jsx",
      "/app/frontend/src/components/ui/badge.jsx",
      "/app/frontend/src/components/ui/input.jsx",
      "/app/frontend/src/components/ui/label.jsx",
      "/app/frontend/src/components/ui/select.jsx",
      "/app/frontend/src/components/ui/table.jsx",
      "/app/frontend/src/components/ui/pagination.jsx",
      "/app/frontend/src/components/ui/tabs.jsx",
      "/app/frontend/src/components/ui/dialog.jsx",
      "/app/frontend/src/components/ui/tooltip.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/skeleton.jsx",
      "/app/frontend/src/components/ui/sonner.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/scroll-area.jsx"
    ],
    "notes": "Projeto usa .js (não .tsx). Criar componentes novos em .jsx seguindo padrão shadcn (named exports)."
  },
  "components_blueprints": {
    "app_shell": {
      "layout": "Sidebar (desktop) + Sheet (mobile) + Topbar fixa com status API e usuário.",
      "sidebar": {
        "items": [
          "Dashboard",
          "Swap",
          "Saque",
          "Depósito (Webhook)",
          "Movimentações (Ledger)",
          "Transações",
          "Auditoria"
        ],
        "active_state": "borda esquerda 2px em teal + bg accent",
        "data_testids": {
          "sidebar": "app-sidebar",
          "nav-dashboard": "nav-dashboard",
          "nav-swap": "nav-swap",
          "nav-withdraw": "nav-withdraw",
          "nav-deposit": "nav-deposit",
          "nav-movements": "nav-movements",
          "nav-transactions": "nav-transactions",
          "nav-audit": "nav-audit"
        }
      },
      "topbar": {
        "left": "Breadcrumb + título da página",
        "right": "API Online pill + email do usuário + botão Sair",
        "api_status": {
          "online": "Badge verde-lime suave",
          "offline": "Badge destructive",
          "data_testid": "api-status-indicator"
        },
        "logout": {
          "component": "Button variant=ghost",
          "data_testid": "topbar-logout-button"
        }
      }
    },
    "balance_card": {
      "use": "Dashboard: 3 cards (BRL/BTC/ETH)",
      "structure": [
        "CardHeader: Token + Badge (ex: 'Disponível')",
        "CardContent: saldo grande (tabular-nums) + valor em BRL menor",
        "Footer: variação 24h (opcional) + ação rápida (Swap/Sacar)"
      ],
      "visual": {
        "token_icon": "círculo 32px com bg secondary e ícone (lucide) em teal",
        "accent": "borda superior 1px em hsla(teal,0.35)"
      },
      "tailwind": "rounded-xl bg-card border border-border p-4 sm:p-5",
      "data_testids": {
        "card": "balance-card-{token}",
        "amount": "balance-card-{token}-amount",
        "brl_value": "balance-card-{token}-brl-value",
        "quick_action": "balance-card-{token}-quick-action"
      }
    },
    "swap_form": {
      "components": [
        "Card",
        "Select (fromToken/toToken)",
        "Input (amount)",
        "Badge (taxa 1.5%)",
        "Separator",
        "Button (Executar)",
        "Skeleton (quote loading)"
      ],
      "layout": "Card com duas colunas no desktop: formulário à esquerda, resumo/quote à direita.",
      "quote_panel": {
        "fields": [
          "Cotação (rate)",
          "Taxa (1.5%)",
          "Total destino",
          "Última atualização (timestamp)"
        ],
        "microcopy": "Cotação via CoinGecko",
        "data_testids": {
          "rate": "swap-quote-rate",
          "fee": "swap-quote-fee",
          "to_total": "swap-quote-to-total"
        }
      },
      "interactions": {
        "debounce": "debounce 350–500ms ao digitar amount para chamar /quote",
        "button_state": "disabled enquanto loading/sem quote/amount inválido",
        "success_toast": "sonner: 'Swap executado' + txId",
        "error_toast": "sonner: mensagem curta + 'Ver detalhes' abre Dialog com payload"
      },
      "data_testids": {
        "from_select": "swap-from-token-select",
        "to_select": "swap-to-token-select",
        "amount_input": "swap-amount-input",
        "execute_button": "swap-execute-button"
      }
    },
    "withdraw_form": {
      "components": [
        "Card",
        "Select (token)",
        "Input (amount)",
        "Input (destinationAddress opcional)",
        "Button (Solicitar saque)"
      ],
      "risk_note": "Texto pequeno: 'Endereço opcional (simulação). Em produção, valide rede e checksum.'",
      "data_testids": {
        "token_select": "withdraw-token-select",
        "amount_input": "withdraw-amount-input",
        "address_input": "withdraw-destination-address-input",
        "submit_button": "withdraw-submit-button"
      }
    },
    "deposit_simulator": {
      "goal": "Evidenciar idempotência do webhook",
      "components": [
        "Card",
        "Input (idempotencyKey readonly)",
        "Button (Gerar UUID)",
        "Select (token)",
        "Input (amount)",
        "Button (Disparar depósito)",
        "Button variant=secondary (Repetir com mesma key)",
        "Table (últimas tentativas)"
      ],
      "interaction": {
        "uuid": "gerar UUID v4 no client",
        "duplicate_test": "botão 'Repetir' reenvia mesma key para provar idempotência",
        "result": "mostrar status + depositId + createdAt"
      },
      "data_testids": {
        "idempotency_input": "deposit-idempotency-key-input",
        "generate_uuid": "deposit-generate-uuid-button",
        "token_select": "deposit-token-select",
        "amount_input": "deposit-amount-input",
        "fire_button": "deposit-fire-webhook-button",
        "repeat_button": "deposit-repeat-webhook-button",
        "attempts_table": "deposit-attempts-table"
      }
    },
    "paginated_table": {
      "use": "Movements e Transactions",
      "components": [
        "Table",
        "Badge",
        "Pagination",
        "Select (pageSize)",
        "Input (search opcional)",
        "Skeleton (loading rows)"
      ],
      "table_style": "linhas com hover bg-secondary/40; cabeçalho sticky em desktop dentro de ScrollArea",
      "pagination": {
        "pattern": "server-driven: page + pageSize",
        "controls": "Primeira/Anterior/Próxima/Última + 'Página X de Y'",
        "data_testids": {
          "pagination": "table-pagination",
          "page_size": "table-page-size-select",
          "next": "table-pagination-next",
          "prev": "table-pagination-prev"
        }
      }
    },
    "ledger_row": {
      "use": "Movements (DEPOSIT/SWAP_IN/SWAP_OUT/SWAP_FEE/WITHDRAWAL)",
      "columns": [
        "Data",
        "Tipo (Badge)",
        "Token",
        "Amount (tabular-nums)",
        "Before → After (mini diff)",
        "Ref (txId/depositId)"
      ],
      "badge_mapping": {
        "DEPOSIT": "Badge teal",
        "SWAP_IN": "Badge teal",
        "SWAP_OUT": "Badge secondary",
        "SWAP_FEE": "Badge warning (laranja)",
        "WITHDRAWAL": "Badge destructive"
      },
      "micro_interaction": "Hover mostra Tooltip com JSON resumido (movementId, correlationId)",
      "data_testids": {
        "row": "ledger-row-{movementId}",
        "type": "ledger-row-{movementId}-type",
        "before": "ledger-row-{movementId}-before",
        "after": "ledger-row-{movementId}-after"
      }
    },
    "transactions_expandable": {
      "use": "Transactions list com detalhes de movimentos relacionados",
      "pattern": "cada linha abre Collapsible/Accordion com sub-tabela de movimentos",
      "data_testids": {
        "row": "transactions-row-{transactionId}",
        "expand": "transactions-row-{transactionId}-expand",
        "details": "transactions-row-{transactionId}-details"
      }
    },
    "reconciliation_panel": {
      "use": "Auditoria: saldo reconstruído vs armazenado",
      "components": [
        "Tabs (BRL/BTC/ETH)",
        "Card",
        "Progress (diferença)",
        "Badge (OK/Divergente)",
        "Button (Reconciliar/Recarregar)",
        "Table (últimos movimentos usados no cálculo)"
      ],
      "visual": "Card principal com dois números grandes lado a lado + delta em destaque",
      "data_testids": {
        "token_tabs": "audit-token-tabs",
        "stored_balance": "audit-stored-balance",
        "rebuilt_balance": "audit-rebuilt-balance",
        "delta": "audit-delta",
        "refresh": "audit-refresh-button"
      }
    },
    "login_form": {
      "layout": "Split-screen no desktop: esquerda (branding + bullets requisitos), direita (form). No mobile vira coluna.",
      "components": [
        "Card",
        "Input (email/senha)",
        "Button (Entrar)",
        "Button variant=secondary (Criar conta)",
        "Alert (erro)",
        "Badge (credenciais demo)"
      ],
      "demo_creds": "Mostrar bloco fixo: demo@nexus.com / demo1234 com botão 'Copiar'.",
      "data_testids": {
        "email": "login-email-input",
        "password": "login-password-input",
        "submit": "login-submit-button",
        "demo_copy": "login-demo-copy-button",
        "error": "login-error-alert"
      }
    }
  },
  "page_by_page_wireframes": {
    "/login": {
      "above_fold": [
        "Brand mark 'Nexus Wallet' + subtítulo 'API REST Test — Fintech Crypto'",
        "Lista curta (3–5 itens) evidenciando requisitos: JWT, Swap CoinGecko, Webhook idempotente, Ledger auditável, Paginação",
        "Card de login com email/senha + CTA Entrar",
        "Bloco 'Credenciais demo' com copiar"
      ],
      "below": [
        "Rodapé mínimo: versão do app + link para status da API (ping)"
      ]
    },
    "/register": {
      "structure": [
        "Mesmo shell visual do login",
        "Card: email + senha + confirmar senha (se existir) + CTA Criar conta",
        "Link 'Já tenho conta'"
      ]
    },
    "/dashboard": {
      "top": [
        "Header: Total em BRL (grande) + 'Atualizado há Xs'",
        "Ações rápidas: Swap / Sacar / Depositar"
      ],
      "main_grid": [
        "Row 1: 3 BalanceCards (BRL/BTC/ETH)",
        "Row 2 (lg): esquerda 8 col (Movimentações recentes mini-table), direita 4 col (Status API + Atalhos + Auditoria rápida)"
      ],
      "proof_of_requirements": [
        "Widget 'Webhook idempotente' com último idempotencyKey usado",
        "Widget 'Taxa swap 1.5%' sempre visível"
      ]
    },
    "/swap": {
      "layout": [
        "Título + descrição curta",
        "Grid 2 col (desktop): Form (esq) + Quote/Resumo (dir)",
        "Abaixo: tabela 'Swaps recentes' paginada"
      ]
    },
    "/withdraw": {
      "layout": [
        "Card form",
        "Abaixo: tabela 'Saques recentes' (filtrável por token/status)"
      ]
    },
    "/deposit": {
      "layout": [
        "Card 'Simulador de Depósito (Webhook)'",
        "Seção 'Testar duplicação' com botão repetir",
        "Tabela de tentativas (mostra idempotencyKey, status, depositId)"
      ]
    },
    "/movements": {
      "layout": [
        "Barra de filtros: token (Select), tipo (Select), período (Calendar opcional), buscar por ref",
        "Tabela paginada com before/after",
        "Empty state explicando tipos de movimento"
      ]
    },
    "/transactions": {
      "layout": [
        "Tabela paginada de transações",
        "Cada linha expandível mostra movimentos relacionados (sub-table)",
        "Badge por tipo (DEPOSIT/SWAP/WITHDRAWAL)"
      ]
    },
    "/audit": {
      "layout": [
        "Tabs por token",
        "Card comparativo: armazenado vs reconstruído + delta",
        "Tabela de movimentos usados no cálculo",
        "CTA 'Recarregar'"
      ]
    }
  },
  "states_and_feedback": {
    "loading": {
      "pattern": "Skeleton em cards e linhas de tabela; botão mostra spinner (lucide Loader2) e texto 'Carregando…'",
      "data_testids": {
        "global": "loading-indicator"
      }
    },
    "empty": {
      "pattern": "Card com ícone + título + ação sugerida (ex: 'Faça um depósito simulado')",
      "copy_examples": {
        "movements": "Nenhuma movimentação encontrada com os filtros atuais.",
        "transactions": "Sem transações ainda. Use o Depósito (Webhook) para gerar dados."
      }
    },
    "error": {
      "pattern": "Alert destructive no topo do Card + toast sonner; oferecer 'Tentar novamente'",
      "api_offline": "Topbar mostra 'API Offline' e desabilita ações mutáveis (swap/withdraw/deposit)"
    },
    "success": {
      "pattern": "Toast sonner com resumo + id (txId/depositId/withdrawalId) + botão copiar"
    }
  },
  "motion_and_microinteractions": {
    "library": {
      "recommended": "framer-motion (leve) para transições de página e expand/collapse",
      "install": "npm i framer-motion",
      "usage_notes": "Usar apenas em containers (fade/slide 8–12px). Evitar animações contínuas. Respeitar prefers-reduced-motion."
    },
    "hover": [
      "Cards: hover eleva levemente (shadow) e borda fica mais clara",
      "Rows: hover bg-secondary/40",
      "Buttons: hover brightness-110; active scale-95"
    ],
    "page_transition": "fade-in 160ms + translateY(6px)"
  },
  "charts_optional": {
    "library": "recharts",
    "install": "npm i recharts",
    "use_cases": [
      "Mini área 'Total em BRL (7 dias)' no Dashboard",
      "Sparkline por token dentro do BalanceCard (opcional)"
    ],
    "guidance": "Manter 1 gráfico no máximo por viewport; cores chart-1/2; gridlines bem sutis."
  },
  "accessibility": {
    "focus": "Sempre usar ring visível (ring-2 ring-ring ring-offset-2 ring-offset-background)",
    "labels": "Label obrigatório para inputs; placeholder não substitui label",
    "contrast": "Garantir AA: texto normal >= 4.5:1; não usar lime para texto longo",
    "keyboard": "Sidebar e tabelas navegáveis; botões de paginação com aria-label"
  },
  "images_and_assets": {
    "image_urls": [
      {
        "category": "auth-background",
        "description": "Imagem abstrata teal para o lado esquerdo do login/register (com overlay escuro sólido para legibilidade).",
        "url": "https://images.pexels.com/photos/14297430/pexels-photo-14297430.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      },
      {
        "category": "app-noise-texture",
        "description": "Textura/grain para overlay global (opacity baixa).",
        "url": "https://images.pexels.com/photos/7599717/pexels-photo-7599717.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      }
    ]
  },
  "instructions_to_main_agent": [
    "Aplicar tema dark-first substituindo tokens HSL em /app/frontend/src/index.css; manter compatibilidade com shadcn.",
    "Remover estilos default do CRA em App.css (App-header etc) e não centralizar layout global.",
    "Criar AppShell com Sidebar + Topbar; usar Sheet para navegação mobile.",
    "Todas as ações e elementos críticos devem ter data-testid (kebab-case) conforme blueprint.",
    "Usar sonner para toasts; padronizar mensagens PT-BR curtas e técnicas (avaliadores).",
    "Evitar gradientes grandes: apenas overlays radiais discretos no topo do dashboard/login.",
    "Implementar estados loading/empty/error em todas as páginas (Skeleton + Alert + retry).",
    "Tabelas: usar Table + Pagination shadcn; paginação server-driven; cabeçalho sticky em desktop com ScrollArea.",
    "Swap: debounce quote; mostrar taxa 1.5% sempre; exibir fonte CoinGecko.",
    "Depósito: evidenciar idempotencyKey e botão de repetição com mesma key."
  ]
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
