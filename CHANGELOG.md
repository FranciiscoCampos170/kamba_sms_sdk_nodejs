# Changelog

## 2.1.0

- Adiciona os recursos públicos `notify`, `email` e `transactions`.
- Inclui templates Notify, renderização, entregas e envio idempotente.
- Inclui domínios Email, envio unitário, templates, Sandbox e bulk.
- Inclui templates e eventos multicanal do Kamba Transactions.
- Adiciona tipos TypeScript, validação local, testes de contratos HTTP e exemplos no README.

## 2.0.0

- Simplifica o README com guia de utilização e exemplos dos métodos públicos.

- Alinha contratos de SMS, OTP, saldo e histórico com o backend modular atual.
- Adiciona Verify, Lookup, estatísticas, consumo, consulta de bulk e cancelamento de agendamentos.
- Suporta fallback Telegram, idempotência, request ID, timeout e cancelamento.
- Preserva respostas sandbox e operações HTTP 202 pendentes de reconciliação.
- Corrige limites de bulk, validações e tratamento de erros HTTP não JSON.
- Atualiza URL padrão para `https://api.kambasms.ao` e restringe conteúdo do pacote npm.
- Inclui testes de contratos HTTP e guia de migração no README.

Alterações incompatíveis: tipos de resposta com variantes pendentes, saldo anulável,
`details: unknown`, falhas de transporte com estado 0 e timeout padrão de 30 segundos.
