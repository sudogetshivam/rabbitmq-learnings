// Day 1 - RabbitMQ Consumer (Worker / Mail Processing Service)

// amqplib = AMQP client jo RabbitMQ broker (port 5672) se async messaging ke through baat karta hai
// Consumer ka role hota hai queue se messages ko receive karke process karna (background worker concept)
const amqp = require("amqplib")

async function recieveMail() {
    try {
        // Step 1: RabbitMQ Broker se connection establish karna
        // Yeh same broker hai jahan producer message publish karta hai
        // Internally: TCP socket + AMQP handshake + authentication (guest/guest by default localhost)
        const connection = await amqp.connect("amqp://localhost")

        // Step 2: Channel create karna (lightweight communication layer)
        // Ek hi connection par multiple channels run ho sakte hain (efficient architecture)
        // Real microservices me: 1 worker service = 1 channel (common pattern)
        const channel = await connection.createChannel()

        // Step 3: Queue assert karna (ensure queue exists before consuming)
        // Idempotent operation: agar queue already producer ne create ki hai, yeh usko reuse karega
        // durable:false = queue memory based hai (broker restart → messages lost)
        // Return object me messageCount aur consumerCount bhi milta hai (monitoring purpose)
        await channel.assertQueue("mail_queue", {durable:false})

        // Step 4: Consumer start karna (subscription to queue)
        // Yeh line broker ko bolti hai:
        // "Jab bhi mail_queue me new message aaye, mujhe push kar dena"
        // IMPORTANT: RabbitMQ push-based system hai (polling nahi hota)
        channel.consume("mail_queue",(message)=>{

            // message = AMQP message object (not direct JSON)
            // message.content = Buffer format me hota hai (binary data)
            // Isliye JSON.parse se pehle Buffer → string → object conversion hota hai
            console.log("Message Recieved",JSON.parse(message.content))

            // Step 5: Manual Acknowledgement (VERY CRITICAL CONCEPT)
            // ack ka matlab: "Broker, maine message successfully process kar liya"
            // Agar ack nahi bheja:
            // - Message unacked state me rahega
            // - Consumer crash hua to message dubara requeue ho sakta hai
            // Yeh reliability ka core feature hai RabbitMQ ka (at-least-once delivery)
            channel.ack(message)

            // Internal Flow after ack:
            // Broker → message ko queue se permanently delete kar deta hai
            // messageCount decreases (visible in RabbitMQ UI)
        })

        // Note:
        // channel.consume ek long-running subscription hai
        // Yeh process tab tak chalta rahega jab tak app band na ho
        // Isliye yahan connection.close() nahi karte (unlike producer)

    } catch (error) {
        // Common distributed system errors:
        // - Broker not running
        // - Wrong port/URL
        // - Queue mismatch
        // - Network issues
        console.error(error)
        
    }
}

// Entry point: Yeh ek Worker Service ki tarah behave kar raha hai
// Real-world analogy:
// Producer = Job Creator (Email Service API)
// Consumer = Background Worker (Email Sender Service)
// Queue = Job Buffer (decoupling + scalability)
recieveMail();
