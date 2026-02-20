// Consumer Worker - Sirf subscribed users ki queue listen karega
// Role: Queue se message uthana, process karna, aur ACK bhejna

const amqp = require("amqplib");

async function recieveSubscribedMails() {
    try {
        // Step 1: RabbitMQ broker se connect
        const connection = await amqp.connect("amqp://localhost");

        // Step 2: Channel create (message receive karne ke liye)
        const channel = await connection.createChannel();

        const queue = "subscribed_users_mail_queue";

        // Step 3: Queue assert (ensure queue exist before consuming)
        // Idempotent hai - already exist ho toh reuse ho jayegi
        await channel.assertQueue(queue, { durable: false });

        console.log("Waiting for subscribed user mails...");

        // Step 4: Consumer start (push-based system, polling nahi hota)
        // RabbitMQ automatically message push karega jab queue me message aayega
        channel.consume(queue, (message) => {

            // message.content = Buffer hota hai (binary format)
            // Isliye parse karne se pehle string me convert karte hain
            const data = JSON.parse(message.content.toString());

            console.log("Subscribed User Mail Received:", data);

            // Step 5: ACK (Acknowledgement)
            // Broker ko bol rahe: "Message successfully process ho gaya"
            // Agar ACK nahi bheja toh message requeue ho sakta hai (reliability feature)
            channel.ack(message);

            // ACK ke baad broker message ko queue se permanently delete kar deta hai
        });

        // Note: Consumer long-running process hota hai
        // Isliye connection yahan close nahi karte (continuous listening)

    } catch (error) {
        console.error(error);
    }
}

// Entry point - Background worker service
recieveSubscribedMails();