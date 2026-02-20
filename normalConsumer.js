// Consumer Worker - Normal users ki queue listen karega
// Yeh separate worker hai jo specific queue ko process karta hai

const amqp = require("amqplib");

async function recieveUserMails() {
    try {
        // Step 1: Broker se connection
        const connection = await amqp.connect("amqp://localhost");

        // Step 2: Channel create (communication layer)
        const channel = await connection.createChannel();

        const queue = "users_mail_queue";

        // Step 3: Queue assert (ensure exist)
        // Queue = actual storage jahan messages wait karte hain jab tak consumer process na kare
        await channel.assertQueue(queue, { durable: false });

        console.log("Waiting for normal user mails...");

        // Step 4: Consume messages from queue
        // Flow: Queue → Consumer → Processing → ACK → Delete from queue
        channel.consume(queue, (message) => {

            // Buffer → String → JSON conversion
            const data = JSON.parse(message.content.toString());

            console.log("Normal User Mail Received:", data);

            // Manual ACK = Reliable processing
            // Agar consumer crash ho jaye before ACK, message dubara queue me aa sakta hai
            channel.ack(message);

            // ACK ke baad messageCount queue me decrease hota hai (UI me visible)
        });

        // Important:
        // Jab tak yeh script run ho rahi hai, consumer active rahega
        // Stop karte hi consumerCount = 0 ho jayega aur messages queue me accumulate honge

    } catch (error) {
        console.error(error);
    }
}

// Entry point - Dedicated worker for normal users
recieveUserMails();