// Order Consumer Worker
// Sirf order related events handle karega (event-driven microservice style)

const amqp = require("amqplib");

async function receiveOrderMessages() {
    try {
        // Broker connection establish
        const connection = await amqp.connect("amqp://localhost");

        // Channel create for consuming messages
        const channel = await connection.createChannel();

        const exchange = "notification_exchange";
        const exchangeType = "topic";
        const queue = "order_queue";

        // Exchange ensure exist (same exchange jo producer use kar raha hai)
        await channel.assertExchange(exchange, exchangeType, { durable: true });

        // Queue declare (stateful component - messages yahan store hote hain)
        await channel.assertQueue(queue, { durable: true });

        // Topic binding: "order.*"
        // Matlab: order.placed, order.cancelled, order.updated sab yahan route honge
        await channel.bindQueue(queue, exchange, "order.*");

        console.log("Waiting for order messages...");

        // Queue se messages consume karna
        // Flow: Exchange → Queue → Consumer → ACK → Delete
        channel.consume(
            queue,
            (msg) => {
                if (msg !== null) {
                    console.log(
                        `[Order Consumer] Routing Key: ${msg.fields.routingKey}`
                    );

                    // Actual message content (JSON string format)
                    console.log(`Message: ${msg.content.toString()}`);

                    // Manual ACK for reliable processing
                    // Agar ACK nahi bheja toh message requeue ho sakta hai (crash safety)
                    channel.ack(msg);
                }
            },
            { noAck: false }
        );

        // Yeh worker continuously listen karta rahega jab tak process band na ho

    } catch (error) {
        console.log(error);
    }
}

receiveOrderMessages();