const express = require('express');
const amqp = require('amqplib');
const winston = require('winston');
const app = express();
const port = 3001;

app.use(express.json());

// Настройка логгера
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'm1.log' })
  ]
});

async function sendToRabbitMQ(data) {
  const rabbitMQConnection = await amqp.connect('amqp://localhost');
  const channel = await rabbitMQConnection.createChannel();
  const requestQueue = 'requestQueue';

  await channel.assertQueue(requestQueue, { durable: false });
  channel.sendToQueue(requestQueue, Buffer.from(JSON.stringify(data)));

  logger.info('Data sent to RabbitMQ:', data);

  await channel.close();
  await rabbitMQConnection.close();
}

app.post('/process-data', (req, res) => {
  try {
    const inputData = req.body;

    sendToRabbitMQ(inputData);

    logger.info('Data processing request sent to M2:', inputData);

    res.json({ message: 'Data processing request sent to M2' });
  } catch (error) {
    logger.error('Error processing request:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  logger.info(`M1 is running on port ${port}`);
});