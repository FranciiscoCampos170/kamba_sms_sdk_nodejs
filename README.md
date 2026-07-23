# 🇦🇴 KambaSMS Node.js SDK

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/kambasms)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

SDK oficial e leve da **KambaSMS** para integração de envio de mensagens SMS em Angola. Desenvolvido em TypeScript, com validações nativas para garantir a conformidade com as regras das operadoras angolanas (Unitel, Africell, Movicel).

## ✨ Funcionalidades

- 🚀 **Leve e Rápido**: Utiliza a API `fetch` nativa do Node.js (sem dependências pesadas como `axios`).
- 🛡️ **Validação no Cliente**: Deteta números inválidos, URLs ou emojis *antes* de fazer a chamada à API, poupando tempo e créditos.
- 💎 **Totalmente Tipado**: Suporte nativo a TypeScript para melhor experiência de desenvolvimento (DX).
- 📦 **MVP Completo**: Envio único, envio em massa, agendamento e gestão de saldo/histórico.

## 📦 Instalação

Instala o pacote via npm ou yarn:

```bash
npm install kambasms
# ou
yarn add kambasms
```

Nota: Requer Node.js v18.0.0 ou superior.

## ⚡ Início Rápido

### 1. Inicialização

Obtém a tua chave API no [Dashboard da KambaSMS](https://kambasms.ao/dashboard/keys) e inicializa o cliente.

#### CommonJS (Node.js tradicional)

```javascript
const { KambaSMS } = require('kambasms');

const client = new KambaSMS({
  apiKey: process.env.KAMBA_API_KEY, // A tua chave (ex: kamba_xxxxx...)
  // baseUrl: 'http://localhost:3001' // Opcional: para testes locais
});
```

#### ES Modules / TypeScript

```typescript
import { KambaSMS } from 'kambasms';

const client = new KambaSMS({
  apiKey: process.env.KAMBA_API_KEY, // A tua chave (ex: kamba_xxxxx...)
  // baseUrl: 'http://localhost:3001' // Opcional: para testes locais
});
```

### 2. Enviar um SMS Único

```javascript
async function enviarSMS() {
  try {
    const response = await client.sms.send({
      to: '+244923456789',
      text: 'O seu código de verificação é 1234. Não partilhe com ninguém.',
      senderId: 'KAMBA' // Opcional: usa o Sender ID da tua API Key se omitido
    });

    console.log('✅ SMS enviado com sucesso!');
    console.log('ID da mensagem:', response.message_id);
    console.log('Saldo restante:', response.remaining_balance);
  } catch (error) {
    console.error('Falha no envio:', error.message);
  }
}

enviarSMS();
```

### 3. Envio em Massa (Bulk)

Ideal para campanhas de marketing ou notificações para múltiplos contactos. Cada pedido pode conter, no máximo, 1000 destinatários.

```javascript
async function enviarEmMassa() {
  try {
    const response = await client.sms.sendBulk({
      name: 'Campanha Natal 2024',
      senderId: 'PROMO',
      text: 'Feliz Natal! Aproveite 20% de desconto na sua próxima compra.',
      recipients: [
        '+244923456789',
        '+244933123456',
        '+244943987654'
      ]
    });

    console.log('✅ Job de envio em massa criado!');
    console.log('ID do Job:', response.job_id);
    console.log('Total de destinatários:', response.total);
  } catch (error) {
    console.error('Falha no envio em massa:', error.message);
  }
}

enviarEmMassa();
```
### 4. Agendar um SMS

```javascript
async function agendarSMS() {
  try {
    // Podes usar uma string ISO ou um objeto Date do JavaScript
    const dataFutura = new Date();
    dataFutura.setHours(dataFutura.getHours() + 2); // Daqui a 2 horas

    const response = await client.sms.schedule({
      to: '+244923456789',
      text: 'Lembrete: A sua consulta está marcada para amanhã.',
      senderId: 'CLINICA',
      scheduledAt: dataFutura
    });

    console.log('✅ SMS agendado com sucesso!', response.scheduled);
  } catch (error) {
    console.error('Falha no agendamento:', error.message);
  }
}

agendarSMS();
```

### 5. Consultar Saldo e Histórico

```javascript
async function gerirConta() {
  try {
    // Verificar saldo
    const balance = await client.account.getBalance();
    console.log('Saldo atual:', balance.balance, 'SMS');

    // Ver histórico de envios (últimos 100 por padrão)
    const history = await client.account.getHistory({ limit: 10 });
    console.log('Últimos envios:', history);
  } catch (error) {
    console.error('Falha ao consultar a conta:', error.message);
  }
}

gerirConta();
```
## 🛡️ Regras de Validação (Específicas para Angola)

O SDK realiza validações automáticas no lado do cliente para garantir que as tuas mensagens cumprem as regras das operadoras angolanas. Se alguma destas regras for violada, o SDK lança um `KambaValidationError` **sem fazer qualquer chamada à API**.

1. **Formato do número**: Deve começar obrigatoriamente com `+244`, seguido de exatamente 9 dígitos.  
   Exemplo: `+244923456789`

2. **Sem URLs**: Mensagens que contenham `http://`, `https://`, `www.` ou domínios como `.com` e `.ao` são rejeitadas, pois podem ser filtradas como spam pelas operadoras.

3. **Sem emojis**: Caracteres emoji não são suportados e podem causar a cobrança de múltiplos segmentos ou o bloqueio da mensagem.

4. **Limite de caracteres**: Cada SMS pode conter, no máximo, 160 caracteres.

Adiciona esta secção depois de **Regras de Validação**:

## ⚠️ Tratamento de Erros

O SDK exporta classes de erro específicas para permitir o tratamento adequado de diferentes tipos de falha:

```typescript
import {
  KambaSMS,
  KambaValidationError,
  KambaAPIError
} from 'kambasms';

const client = new KambaSMS({
  apiKey: 'kamba_...'
});

async function testarErros() {
  try {
    await client.sms.send({
      to: '923456789', // Erro: falta o +244
      text: 'Acesse www.kambasms.ao 🚀', // Erro: contém URL e emoji
      senderId: 'KAMBA'
    });
  } catch (error) {
    if (error instanceof KambaValidationError) {
      // Erro de validação do SDK: corrige os dados enviados
      console.error('🚫 Dados inválidos:', error.message);
    } else if (error instanceof KambaAPIError) {
      // Erro retornado pela API, como saldo insuficiente ou limite de pedidos
      console.error(
        '🔌 Erro da API:',
        error.statusCode,
        '-',
        error.message
      );
      console.error('Detalhes:', error.details);
    } else {
      // Erro de rede ou erro inesperado
      console.error('💥 Erro inesperado:', error);
    }
  }
}

testarErros();
```
### Tipos de erro

- `KambaValidationError`: dados inválidos detetados antes da chamada à API.
- `KambaAPIError`: erro retornado pelo servidor da KambaSMS.
- Outros erros: falhas de rede ou erros inesperados.


## 📚 Documentação Completa

Para mais detalhes sobre endpoints avançados, webhooks de entrega e gestão de conta, consulta a [Documentação Oficial da KambaSMS](https://www.kambasms.ao/dashboard/docs).

## 🆘 Suporte

Encontraste um bug ou tens uma sugestão?

- Abre uma [issue neste repositório](https://github.com/FranciiscoCampos170/kamba_sms_sdk_nodejs/issues).
- Contacta a nossa equipa através do [support@kambasms.ao](mailto:support@kambasms.ao).

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).