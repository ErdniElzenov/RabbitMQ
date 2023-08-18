const amqp = require('amqplib');
const winston = require('winston');
const resultsQueue = 'resultsQueue';

// Настройка логгера
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'm2.log' })
  ]
});

async function processAndRespond(data) {
  // Здесь можно выполнить обработку данных
  const processedData = data; // Замените на реальную обработку

  const rabbitMQConnection = await amqp.connect('amqp://localhost');
  const channel = await rabbitMQConnection.createChannel();

  await channel.assertQueue(resultsQueue, { durable: false });
  channel.sendToQueue(resultsQueue, Buffer.from(JSON.stringify(processedData)));

  logger.info('Processed data sent to RabbitMQ:', processedData);

  await channel.close();
  await rabbitMQConnection.close();
}

async function main() {
  const rabbitMQConnection = await amqp.connect('amqp://localhost');
  const channel = await rabbitMQConnection.createChannel();
  const requestQueue = 'requestQueue';

  await channel.assertQueue(requestQueue, { durable: false });

  logger.info('M2 is waiting for requests...');

  channel.consume(requestQueue, (message) => {
    if (message) {
      const requestData = JSON.parse(message.content.toString());
      processAndRespond(requestData);
      logger.info('Request processed:', requestData);
      channel.ack(message);
    }
  });
}

main().catch((error) => {
  logger.error('Error in M2:', error);
});