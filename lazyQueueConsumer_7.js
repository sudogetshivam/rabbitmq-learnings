const amqp = require("amqplib");

async function consumeMessages() {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const queueName = "lazy_notifications_queue";

    await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
            "x-queue-mode": "lazy",
        },
    });

    console.log(`Waiting for messages in ${queueName}`);

    channel.consume(queueName, (msg) => {
        if (msg !== null) {
            console.log(`Received message: ${msg.content.toString()}`);
            channel.ack(msg);
        }
    });
}

consumeMessages();