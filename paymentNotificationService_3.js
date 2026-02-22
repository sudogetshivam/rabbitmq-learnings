// Payment Consumer Worker
// Sirf payment related events consume karega using topic pattern (payment.*)

const amqp = require("amqplib");

async function receivePaymentMessages() {
    try {
        // RabbitMQ broker se connection
        const connection = await amqp.connect("amqp://localhost");

        // Channel create (messages receive karne ke liye)
        const channel = await connection.createChannel();

        const exchange = "notification_exchange";
        const exchangeType = "topic";
        const queue = "payment_queue";

        // Exchange ensure exist (producer aur consumer dono side assert karna best practice hai)
        await channel.assertExchange(exchange, exchangeType, { durable: true });

        // Queue = actual storage buffer jahan messages wait karte hain
        await channel.assertQueue(queue, { durable: true });

        // Binding: topic pattern "payment.*"
        // Matlab: payment.processed, payment.failed, payment.success sab is queue me aayenge
        await channel.bindQueue(queue, exchange, "payment.*");

        console.log("Waiting for payment messages...");

        // Consume = push-based model (RabbitMQ automatically messages bhejta hai)
        channel.consume(
            queue,
            (msg) => {
                if (msg !== null) {
                    // msg.fields.routingKey se pata chalta hai kis event type ka message hai
                    console.log(
                        `[Payment Consumer] Routing Key: ${msg.fields.routingKey}`
                    );

                    // Buffer → String conversion (RabbitMQ binary data send karta hai)
                    console.log(`Message: ${msg.content.toString()}`);

                    // ACK = broker ko confirm ki message successfully process ho gaya
                    // ACK ke baad message queue se delete ho jata hai
                    channel.ack(msg);
                }
            },
            { noAck: false } // manual acknowledgement enabled (reliability)
        );

        // Note: Consumer long-running process hota hai (connection close nahi karte)

    } catch (error) {
        console.log(error);
    }
}

receivePaymentMessages();