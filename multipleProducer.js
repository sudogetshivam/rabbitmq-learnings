// Producer Service - Yeh async job publisher hai
// Kaam: Different type ke users ke liye alag routing keys se messages bhejna

const amqp = require("amqplib");

async function sendMail() {
    try {
        // Step 1: RabbitMQ broker se connection establish
        // "amqp://localhost" = RabbitMQ Docker container same machine pe run ho raha hai
        const connection = await amqp.connect("amqp://localhost");

        // Step 2: Channel create karna (lightweight communication pipe)
        // Saare publish / consume operations channel ke through hote hain
        const channel = await connection.createChannel();

        // Exchange = routing brain (direct exchange = exact routing key match)
        const exchange = "mail_exchange";

        // 2 different routing keys (logic-based message routing)
        const routingKeyForSubSUser = "send_mail_to_subscribed_users";
        const routingKeyForNormalUser = "send_mail_to_user";

        // Message 1 (Subscribed users ke liye)
        const message1 = {
            to: "subscribedconsumer@gmail.com",
            from: "producer@gmail.com",
            subject: "Greetings",
            body: "Hey Buddy",
        };

        // Message 2 (Normal users ke liye)
        const message2 = {
            to: "consumer@gmail.com",
            from: "producer@gmail.com",
            subject: "Greetings",
            body: "Hello User",
        };

        // Step 3: Exchange declare (ensure exist - idempotent)
        // Agar already exist karta hai toh recreate nahi hota
        await channel.assertExchange(exchange, "direct", { durable: false });

        // Step 4: Queues declare (yeh actual message storage buffers hain)
        // durable:false = broker restart hone par queue + messages delete ho jayenge (dev mode)
        await channel.assertQueue("subscribed_users_mail_queue", { durable: false });
        await channel.assertQueue("users_mail_queue", { durable: false });

        // Step 5: Binding (Exchange ko batate hain kaunsi routing key kis queue me jayegi)
        // Matlab: agar routingKeyForSubSUser aaya → subscribed queue me route karo
        await channel.bindQueue(
            "subscribed_users_mail_queue",
            exchange,
            routingKeyForSubSUser
        );

        // Matlab: agar routingKeyForNormalUser aaya → normal users queue me route karo
        await channel.bindQueue(
            "users_mail_queue",
            exchange,
            routingKeyForNormalUser
        );

        // Step 6: Publish messages to EXCHANGE (direct queue ko nahi bhejte)
        // Internal flow: Producer → Exchange → (routing key match) → Queue
        // Buffer.from() kyunki RabbitMQ binary data accept karta hai
        channel.publish(
            exchange,
            routingKeyForSubSUser,
            Buffer.from(JSON.stringify(message1))
        );

        channel.publish(
            exchange,
            routingKeyForNormalUser,
            Buffer.from(JSON.stringify(message2))
        );

        // Note: Yeh sirf broker ko message bhejne ka confirmation hai
        // Yeh guarantee nahi deta ki consumer ne process kar liya
        console.log("Messages sent successfully");

        // Thoda delay before closing connection (taaki message flush ho jaye broker tak)
        setTimeout(() => {
            connection.close();
        }, 500);

    } catch (error) {
        // Common errors: broker down, wrong port, exchange mismatch, etc.
        console.log(error);
    }
}

// Entry point - Yeh ek Producer Microservice ki tarah behave karta hai
sendMail();