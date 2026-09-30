# KambaSMS Node.js SDK

SDK TypeScript/JavaScript para os endpoints de SMS, OTP, Verify, Lookup e conta do backend KambaSMS. Versão 2.0.0, sem dependências de execução, para Node.js 18 ou superior.

## Instalação e configuração

```sh
npm install kambasms
```

```js
const { KambaSMS } = require('kambasms');
// TypeScript / ESM: import { KambaSMS } from 'kambasms';

const client = new KambaSMS({
  apiKey: process.env.KAMBA_API_KEY,
  baseUrl: 'https://api.kambasms.ao', // padrão; local: http://localhost:3001
  timeoutMs: 30000,
});
```

A chave é enviada em `x-api-key`. Os exemplos com `await` devem ser executados numa função `async` ou num módulo ESM. A versão deste repositório precisa ser publicada para estar disponível no npm.

## Envio de SMS

```js
const response = await client.sms.send({
  to: '+244923456789',
  text: 'O seu pedido foi recebido.',
  senderId: 'KAMBA',
  // telegramFallback: true,
  // telegramChatId: '123456789',
}, {
  idempotencyKey: 'pedido:123:sms',
});

if (response.success) {
  console.log(response.message_id, response.channel, response.remaining_balance);
} else {
  // HTTP 202: fornecedor aceitou, mas a operação ficou pendente de reconciliação.
  console.log(response.message_id, response.reservation_id, response.error);
}
```

O Sender ID associado à chave tem prioridade sobre `senderId` no envio simples e OTP. O fallback Telegram é tentado pelo backend quando o SMS falha; exige `telegramChatId`.

As validações locais seguem o backend: número `+244` com nove dígitos, texto não vazio com até 160 caracteres, sem os padrões de URL e emoji rejeitados pela API. Bulk, agendamento e Verify validam Sender IDs com 3–11 letras, números ou espaços.

## Envio em massa e agendamentos

```js
const job = await client.sms.sendBulk({
  name: 'Aviso aos clientes',
  senderId: 'KAMBA',
  text: 'A sua encomenda esta pronta.',
  recipients: ['+244923456789', '+244933123456'],
}, { idempotencyKey: 'campanha:123' });

console.log(await client.sms.getBulk(job.job_id));
console.log(await client.sms.listBulk());

const result = await client.sms.schedule({
  to: '+244923456789',
  text: 'Lembrete da sua consulta.',
  senderId: 'CLINICA',
  scheduledAt: new Date(Date.now() + 3600000),
});
console.log(await client.sms.listScheduled());
await client.sms.cancelScheduled(result.scheduled.id);
```

O limite de destinatários é definido pela conta no backend. Consulte `account.getUsage().messaging_limits.bulk_recipient_limit`. O SDK valida todos os números; o backend elimina duplicados. Bulk e agendamento estão sujeitos ao primeiro pagamento, saldo e limites da conta. Só agendamentos pendentes podem ser cancelados.

## Conta

```js
const balance = await client.account.getBalance();
console.log(balance.balance); // null na sandbox, com unlimited: true
const history = await client.account.getHistory({ limit: 10, page: 1 });
const stats = await client.account.getStats(); // estatísticas dos últimos sete dias
const usage = await client.account.getUsage();
console.log(usage.messaging_limits);
```

`GET /messages` devolve até 100 mensagens. `limit` e `page` selecionam localmente uma parte desses registos; não permitem consultar histórico anterior aos últimos 100. Na sandbox, o identificador do fornecedor aparece em `message_id`; em produção, em `twilio_sid`.

## OTP e Verify

```js
await client.otp.send({ phone: '+244923456789', senderId: 'KAMBA' });
await client.otp.verify({ phone: '+244923456789', code: '123456' });

const session = await client.verify.start({
  phone: '+244923456789',
  senderId: 'KAMBA',
  locale: 'pt-AO',
  metadata: { orderId: '123' },
}, { idempotencyKey: 'verify:pedido:123' });

if (session.success) {
  await client.verify.check({ verificationId: session.verification_id, code: '123456' });
  console.log(await client.verify.get(session.verification_id));
}

console.log(await client.verify.list());
console.log(await client.verify.events());
console.log(await client.verify.stats({ days: 30, environment: 'live' }));
// Para uma sessão ainda pendente, respeitando o intervalo do servidor:
// await client.verify.resend(verificationId, { idempotencyKey: 'verify:resend:123' });
```

O OTP legado verifica por telefone e código. Verify usa sessões autenticadas com `verificationId`, eventos e métricas. Verify depende de `FEATURE_VERIFY` no backend. Na sandbox, o código de teste é `123456`; use Verify para iniciar e verificar sessões de teste, pois `/otp/verify` consulta apenas os OTPs reais.

## Lookup

```js
console.log(await client.lookup.lookup('923 456 789'));
console.log(await client.lookup.bulk(['923456789', '+244923456789']));
```

Lookup aceita formatos locais, devolve a normalização, validade e provável operadora pelo prefixo. Não confirma a operadora em tempo real. Máximo de 500 números por consulta em massa; depende de `FEATURE_LOOKUP`.

## Pedidos, erros e sandbox

Todos os métodos aceitam opções no último argumento: `signal`, `requestId` e `idempotencyKey`. A idempotência é aplicada pelo backend em SMS, bulk, agendamento, OTP send, Verify start e Verify resend. Use a mesma chave e o mesmo conteúdo para repetir a mesma operação; a retenção configurada pelo backend é de 24 horas. As chaves aceitam 8–200 caracteres (`A-Z`, `a-z`, dígitos, `.`, `_`, `:`, `-`); `requestId` aceita 8–100.

Não há repetição automática de pedidos. Um timeout não confirma se o fornecedor enviou a mensagem. Respostas HTTP 202 com reconciliação pendente são devolvidas como `PendingResponse`, sem lançar erro nem reenviar.

```js
const { KambaAPIError, KambaValidationError } = require('kambasms');

try {
  await client.account.getBalance();
} catch (error) {
  if (error instanceof KambaValidationError) {
    console.error(error.message); // dados rejeitados localmente
  } else if (error instanceof KambaAPIError) {
    console.error(error.statusCode, error.code, error.requestId, error.retryAfter);
    console.error(error.details);
  } else {
    throw error;
  }
}
```

`statusCode` é o código HTTP, ou `0` para falhas de rede, timeout ou cancelamento. Erros HTTP não JSON preservam o estado HTTP e o texto em `details`. `retryAfter` contém o cabeçalho `Retry-After`, quando presente; campos como `retry_after` no JSON continuam disponíveis em `details`.

A sandbox é determinada pela chave da API. Campos como `simulated`, `charged_credits`, `test_code` e `environment` são preservados. Saldo, segmentos e canal podem estar ausentes nas respostas simuladas.

## Migração de 1.x para 2.0

- URL padrão atualizada de `https://nexasms-api.onrender.com` para `https://api.kambasms.ao`, conforme a documentação do backend. Use `baseUrl` para outro deployment.
- `SendSmsResponse`, `OtpSendResponse` e `VerifyStartResponse` incluem operações pendentes; verifique `response.success` antes de usar os campos de sucesso.
- `BalanceResponse.balance` aceita `null` na sandbox; campos exclusivos de produção tornaram-se opcionais.
- Histórico aplica paginação local; a API não implementa paginação remota.
- Removido o limite fixo de 1000 destinatários. O backend decide conforme a conta.
- Falhas de rede usam `statusCode: 0`; `KambaAPIError.details` passa a `unknown` e deve ser verificado antes de aceder às propriedades.
- Pedidos têm timeout padrão de 30 segundos e não seguem redirecionamentos HTTP.

Os nomes existentes `sms.send`, `sms.sendBulk`, `sms.schedule`, `account.getBalance`, `account.getHistory`, `otp.send` e `otp.verify` foram mantidos. Esta versão cobre as integrações de SMS e verificação descritas acima; não oferece recursos dedicados para Email, Chat, Notify ou administração.

## Desenvolvimento

```sh
npm ci
npm test
npm run typecheck
npm pack --dry-run
```

Os testes usam respostas HTTP simuladas, sem consumir créditos. Os contratos foram comparados com `ABMS-startup-API-JS/src/modules` e os middlewares locais. Não substituem um teste de integração num deployment configurado.
