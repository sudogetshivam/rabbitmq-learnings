// Producer Service - Event Publisher
// Yeh service different events (order, payment) ko RabbitMQ exchange par publish karti hai
// Direct queue ko nahi bhejti, exchange ko bhejti hai (decoupled architecture)

const amqp = require("amqplib");

async function sendMessage(routingKey, message) {
    try {
        // Broker se connection establish (RabbitMQ server se AMQP connection)
        const connection = await amqp.connect("amqp://localhost");

        // Channel = lightweight communication pipe (publishing yahin se hota hai)
        const channel = await connection.createChannel();

        // Topic exchange use kar rahe hain (pattern based routing ke liye)
        const exchange = "notification_exchange";
        const exchangeType = "topic";

        // Exchange ensure exist (idempotent - already ho toh recreate nahi hota)
        await channel.assertExchange(exchange, exchangeType, { durable: true });

        // Message ko exchange par publish kar rahe hain (NOT directly to queue)
        // routingKey decide karega kaunsi queue message receive karegi
        // persistent:true = message disk par store ho sakta hai (durability support)
        channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        console.log(`[x] Sent '${routingKey}' '${JSON.stringify(message)}'`);

        // Thoda delay before closing connection taaki message broker tak flush ho jaye
        setTimeout(() => {
            connection.close();
        }, 500);

    } catch (error) {
        console.log(error);
    }
}

// Different domain events publish kar rahe hain (event-driven pattern)
sendMessage("order.placed", { orderId: 12345, status: "placed" });
sendMessage("payment.processed", { orderId: 47653, status: "processed" });