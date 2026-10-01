# KambaSMS Node.js SDK

Integra SMS, OTP, Verify, Lookup, Notify, Email e Transactions da KambaSMS com JavaScript ou TypeScript.

Requer Node.js 18 ou superior.

## Instalação

```bash
npm install kambasms
```

## Configuração

```js
const { KambaSMS } = require('kambasms');

const client = new KambaSMS({
  apiKey: process.env.KAMBA_API_KEY,
});
```

Em TypeScript ou ES Modules, usa:

```ts
import { KambaSMS } from 'kambasms';

const client = new KambaSMS({
  apiKey: process.env.KAMBA_API_KEY!,
});
```

Define `KAMBA_API_KEY` com a tua chave KambaSMS. Podes configurar também `timeoutMs` (padrão: `30000`) e `baseUrl` (padrão: `https://api.kambasms.ao`).

Os exemplos seguintes usam o mesmo `client`. Executa as chamadas com `await` dentro de uma função `async` ou de um módulo que suporte `await` no nível superior.

## Enviar um SMS

```js
const response = await client.sms.send({
  to: '+244923456789',
  text: 'O seu pedido foi recebido.',
  senderId: 'KAMBA', // opcional quando associado à chave
});

if (response.success) {
  console.log('Mensagem:', response.message_id);
  console.log('Estado:', response.status);
  console.log('Saldo:', response.remaining_balance);
} else {
  console.log('Operação pendente:', response.message_id, response.error);
}
```

O nome de remetente associado à chave tem prioridade sobre `senderId` no envio simples e OTP.

Regras para mensagens:

- Número no formato `+244` seguido de nove dígitos.
- Texto não vazio, até 160 caracteres, sem links ou emojis.
- Nos métodos que exigem `senderId`, usa 3–11 letras, números ou espaços.

## Enviar SMS em massa

```js
const job = await client.sms.sendBulk({
  name: 'Aviso aos clientes',
  senderId: 'KAMBA',
  text: 'A sua encomenda esta pronta.',
  recipients: ['+244923456789', '+244933123456'],
});

console.log('Envio:', job.job_id);
console.log('Destinatários:', job.total);
```

Consulta um envio ou lista os envios em massa:

```js
const details = await client.sms.getBulk(job.job_id);
console.log(details.status, details.sent, details.failed);
console.log(details.recipients);

const jobs = await client.sms.listBulk();
console.log(jobs);
```

O limite de destinatários depende da conta. Números repetidos são considerados uma única vez. O envio exige saldo disponível e primeiro pagamento concluído.

## Agendar um SMS

```js
const result = await client.sms.schedule({
  to: '+244923456789',
  text: 'Lembrete da sua consulta.',
  senderId: 'CLINICA',
  scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // daqui a uma hora
});

console.log('Agendamento:', result.scheduled.id);
```

`scheduledAt` aceita um objecto `Date` ou uma string ISO com uma data futura. O agendamento exige saldo disponível e primeiro pagamento concluído.

Lista ou cancela agendamentos:

```js
const scheduled = await client.sms.listScheduled();
console.log(scheduled);

await client.sms.cancelScheduled(result.scheduled.id);
```

Só é possível cancelar agendamentos pendentes.

## Consultar a conta

### Saldo

```js
const result = await client.account.getBalance();
console.log('Saldo:', result.balance);
```

### Histórico de mensagens

```js
const messages = await client.account.getHistory({ limit: 10, page: 1 });

for (const message of messages) {
  console.log(message.id, message.to, message.status, message.created_at);
}
```

O histórico disponibiliza as últimas 100 mensagens. `limit` (1–100) e `page` selecionam uma parte dessa lista; não permitem consultar mensagens anteriores a esses 100 registos.

### Estatísticas

```js
const stats = await client.account.getStats();

for (const day of stats) {
  console.log(day.date, day.count);
}
```

Devolve a contagem de mensagens dos últimos sete dias.

### Consumo e limites

```js
const usage = await client.account.getUsage();
console.log('Mensagens:', usage.messages);
console.log('Limites:', usage.messaging_limits);
console.log('Máximo por envio em massa:', usage.messaging_limits.bulk_recipient_limit);
```

## Enviar e verificar um OTP

Envia um código para o telefone:

```js
const response = await client.otp.send({
  phone: '+244923456789',
  senderId: 'KAMBA', // opcional
});

if (response.success) {
  console.log('Validade em segundos:', response.expires_in);
} else {
  console.log('Operação pendente:', response.error);
}
```

Quando o utilizador introduzir o código recebido, verifica-o:

```js
const result = await client.otp.verify({
  phone: '+244923456789',
  code: '123456', // substitui pelo código introduzido pelo utilizador
});

console.log(result.success, result.message);
```

## Verificações com Verify

Usa Verify para acompanhar cada verificação por um identificador, consultar eventos e obter métricas.

### Iniciar

```js
const session = await client.verify.start({
  phone: '+244923456789',
  senderId: 'KAMBA', // opcional
  metadata: { orderId: '123' }, // opcional
});

if (session.success) {
  console.log('Guarda este identificador:', session.verification_id);
  console.log('Validade em segundos:', session.expires_in);
} else {
  console.log('Operação pendente:', session.verification_id, session.error);
}
```

Nos exemplos seguintes, substitui `'ID_DA_VERIFICACAO'` pelo identificador devolvido ao iniciar a sessão.

### Confirmar um código

```js
const result = await client.verify.check({
  verificationId: 'ID_DA_VERIFICACAO',
  code: '123456', // código introduzido pelo utilizador
});

console.log(result.status, result.verified_at);
```

### Reenviar um código

```js
const response = await client.verify.resend('ID_DA_VERIFICACAO');

if (response.success) {
  console.log('Código reenviado. Validade:', response.expires_in);
} else {
  console.log('Operação pendente:', response.error);
}
```

A sessão deve estar pendente. Aguarda pelo menos 60 segundos entre envios; são permitidos até dois reenvios.

### Consultar sessões e eventos

```js
const session = await client.verify.get('ID_DA_VERIFICACAO');
console.log(session.status, session.attempts);

const sessions = await client.verify.list();
console.log(sessions);

const events = await client.verify.events('ID_DA_VERIFICACAO');
console.log(events);

// Eventos de todas as verificações:
const allEvents = await client.verify.events();
```

### Consultar métricas

```js
const stats = await client.verify.stats({
  days: 30, // entre 1 e 90
  environment: 'live', // 'live', 'test' ou 'all'
});

console.log(stats.total, stats.verified, stats.conversion_rate);
```

## Consultar números com Lookup

### Um número

```js
const result = await client.lookup.lookup('923 456 789');
console.log(result.valid, result.normalized, result.likely_operator);
```

### Vários números

```js
const result = await client.lookup.bulk(['923456789', '+244923456789']);
console.log(result.summary);
console.log(result.results);
```

Lookup aceita formatos locais e internacionais e até 500 números por consulta em massa. A operadora indicada é uma estimativa pelo prefixo, não uma confirmação em tempo real.

## Notificações transacionais com Notify

Cria um template uma vez e envia notificações com variáveis. A chave API precisa do scope `notify`.

```js
await client.notify.createTemplate({
  key: 'appointment_reminder',
  name: 'Lembrete de consulta',
  body: 'Olá {{name}}, a sua consulta está marcada para {{date}}.',
});

const result = await client.notify.send({
  to: '+244923456789',
  templateKey: 'appointment_reminder',
  variables: { name: 'Ana', date: '10/10 às 09:00' },
}, { idempotencyKey: 'appointment:123:reminder' });
```

Também estão disponíveis `listTemplates()`, `render()`, `listDeliveries()` e `disableTemplate()`.

## Email transacional

O Kamba Email usa volume próprio, separado dos créditos SMS. Em produção, adiciona e verifica um domínio antes de enviar. A chave API precisa do scope `email`.

```js
const domain = await client.email.createDomain('example.ao');
// Publica os registos DNS devolvidos e, depois, verifica:
await client.email.verifyDomain(domain.id);

await client.email.send({
  to: 'cliente@example.com',
  domainId: domain.id,
  fromLocal: 'alertas',
  fromName: 'Minha Empresa',
  subject: 'Pedido recebido',
  html: '<p>O pedido <strong>#123</strong> foi recebido.</p>',
}, { idempotencyKey: 'order:123:email' });
```

O recurso `email` inclui gestão de domínios e templates, renderização, envio unitário, Sandbox e bulk de até 500 destinatários por pedido. Os limites efetivos dependem do plano da conta.

```js
const template = await client.email.createTemplate({
  key: 'receipt', name: 'Recibo', subject: 'Recibo {{id}}', html: '<p>Recibo {{id}}</p>',
});

const job = await client.email.sendBulk({
  domainId: domain.id,
  fromLocal: 'financeiro',
  templateId: template.id,
  recipients: [
    { email: 'ana@example.com', variables: { id: 'FT-123' } },
  ],
}, { idempotencyKey: 'receipts:2026-10-01' });
```

## Eventos com Kamba Transactions

Transactions recebe um evento do teu sistema e entrega a comunicação pelos canais definidos no template. Não processa pagamentos, cartões nem dinheiro. A chave API precisa do scope `transactions`.

```js
await client.transactions.createTemplate({
  key: 'meeting_notice',
  eventType: 'meeting.scheduled',
  name: 'Reunião agendada',
  channels: ['sms'],
  smsBody: 'A sua reunião foi agendada para {{date}}.',
});

const event = await client.transactions.sendEvent({
  event: 'meeting.scheduled',
  templateKey: 'meeting_notice',
  externalReference: 'meeting-123',
  customer: { phone: '+244923456789' },
  data: { date: '10/10 às 09:00' },
}, { idempotencyKey: 'meeting:123' });

console.log(event.status, event.deliveries);
```

Um template também pode usar `channels: ['sms', 'email']`; nesse caso informa o domínio verificado, o remetente e os dados do destinatário para ambos os canais.

## Ambiente de testes

Usa uma chave de teste para simular operações. Nesse ambiente, o saldo é `null` e as respostas podem incluir `environment: 'test'`, `simulated` e `test_code`.

Para testar um fluxo completo de verificação, usa Verify:

```js
const testClient = new KambaSMS({ apiKey: process.env.KAMBA_TEST_API_KEY });
const session = await testClient.verify.start({ phone: '+244923456789' });

if (session.success && session.test_code) {
  const result = await testClient.verify.check({
    verificationId: session.verification_id,
    code: session.test_code,
  });
  console.log(result.status);
}
```

`otp.verify()` destina-se aos códigos enviados em produção. Usa `verify.check()` para confirmar os códigos das sessões de teste.

## Evitar operações duplicadas

Passa `idempotencyKey` no segundo argumento ao enviar SMS, email, Notify, Transactions, enviar em massa, agendar, enviar OTP, iniciar Verify ou reenviar um código Verify:

```js
const response = await client.sms.send({
  to: '+244923456789',
  text: 'O seu pedido foi recebido.',
}, {
  idempotencyKey: 'pedido:123:sms',
});
```

Para repetir a mesma operação, reutiliza a chave e o mesmo conteúdo durante a janela de 24 horas. Para uma nova operação, usa outra chave. A chave deve ter 8–200 caracteres: letras, números, `.`, `_`, `:` ou `-`.

O SDK não repete pedidos automaticamente. Uma operação pendente ou um timeout não significa que a mensagem deixou de ser enviada.

## Cancelar um pedido

Os métodos aceitam `signal` nas opções do último argumento. Para métodos sem parâmetros, as opções são o primeiro argumento:

```js
const controller = new AbortController();
const request = client.account.getBalance({ signal: controller.signal });
controller.abort();

try {
  await request;
} catch (error) {
  console.log(error.message);
}
```

Também podes passar `requestId` para identificar um pedido, com 8–100 caracteres no mesmo formato da chave de idempotência.

## Tratar erros

```js
const { KambaAPIError, KambaValidationError } = require('kambasms');

try {
  await client.sms.send({
    to: '+244923456789',
    text: 'Ola!',
  });
} catch (error) {
  if (error instanceof KambaValidationError) {
    console.error('Dados inválidos:', error.message);
  } else if (error instanceof KambaAPIError) {
    console.error('Erro:', error.message);
    console.error('Estado HTTP:', error.statusCode);
    console.error('Código:', error.code);
    console.error('Identificador do pedido:', error.requestId);
    console.error('Tempo de espera:', error.retryAfter);
  } else {
    throw error;
  }
}
```

`KambaValidationError` indica dados rejeitados antes do pedido. `KambaAPIError` contém o estado HTTP e os detalhes da resposta em `details`; o estado `0` indica falha de rede, timeout ou cancelamento.

Respostas de operações pendentes são devolvidas normalmente, sem lançar erro. Nos métodos de envio de SMS, OTP e Verify, verifica `response.success` antes de usar os campos de sucesso, como nos exemplos acima.
