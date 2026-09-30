# Changelog

## 2.0.0

- Alinha contratos de SMS, OTP, saldo e histórico com o backend modular atual.
- Adiciona Verify, Lookup, estatísticas, consumo, consulta de bulk e cancelamento de agendamentos.
- Suporta fallback Telegram, idempotência, request ID, timeout e cancelamento.
- Preserva respostas sandbox e operações HTTP 202 pendentes de reconciliação.
- Corrige limites de bulk, validações e tratamento de erros HTTP não JSON.
- Atualiza URL padrão para `https://api.kambasms.ao` e restringe conteúdo do pacote npm.
- Inclui testes de contratos HTTP e guia de migração no README.

Alterações incompatíveis: tipos de resposta com variantes pendentes, saldo anulável,
`details: unknown`, falhas de transporte com estado 0 e timeout padrão de 30 segundos.
