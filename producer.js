// Day 1 - RabbitMQ Producer (Mail Job Publisher)
// Yeh file ek Producer Service ko represent karti hai jo async job (email task)
// RabbitMQ broker ko bhejti hai instead of directly calling another service (decoupled architecture)

const amqp = require("amqplib"); // AMQP protocol client for Node.js (RabbitMQ se baat karne ke liye)

async function sendMail(){

    try {
        // Step 1: Broker se connection establish karna
        // "amqp://localhost" => RabbitMQ broker local machine (Docker container) pe run ho raha hai
        // Internally: TCP connection + AMQP handshake + authentication (guest/guest by default)
        const connection = await amqp.connect("amqp://localhost")

        // Step 2: Channel create karna (lightweight virtual communication layer)
        // Connection = expensive, Channel = cheap (best practice: 1 connection, multiple channels)
        // Saare publish/consume operations channel ke through hi hote hain
        const channel = await connection.createChannel();

        // Exchange = routing brain of RabbitMQ
        // Producer direct queue ko message nahi bhejta, pehle exchange ko bhejta hai
        const exchange = "mail_exchange"

        // Routing Key = routing label (direct exchange me exact match required)
        // Yeh decide karta hai kaunsi queue message receive karegi
        const routingKey = "send_mail"

        // Message payload (actual job/event data)
        // Real systems me yeh background tasks hote hain:
        // email sending, payment processing, notifications, video processing etc.
        const message = {
            to:"consumer@gmail.com",
            from:"producer@gmail.com",
            subject:"Greetings",
            body:"Hello World",
        }

        // Step 3: Exchange declare (assert = ensure exists, idempotent operation)
        // Agar exchange already exist karta hai, recreate nahi hoga (safe for microservices)
        // Type: "direct" => exact routingKey based routing
        // durable:false => broker restart hone par exchange delete ho jayega (dev mode)
        // Return: { exchange: "mail_exchange" } (broker confirmation metadata)
        const whatValueWillIget = await channel.assertExchange(exchange, "direct" , {durable:false})

        // Step 4: Queue declare (message storage buffer)
        // Queue = stateful component jahan messages actually store hote hain
        // durable:false => queue memory-based hai (restart = messages lost)
        // Return object contains:
        // - queue: name of queue
        // - messageCount: pending messages in queue
        // - consumerCount: active consumers connected
        const channelValue = await channel.assertQueue("mail_queue", {durable:false})

        // Step 5: Binding (Exchange ↔ Queue relationship define karna)
        // Meaning: jab exchange ko routingKey="send_mail" milega,
        // tab message "mail_queue" me route hoga
        // Agar binding nahi hoti → exchange message drop kar deta (no route)
        // Return: {} (AMQP Queue.Bind-Ok frame me koi extra data nahi hota)
        const queueuValue = await channel.bindQueue("mail_queue",exchange,routingKey)

        // Step 6: Publish message to EXCHANGE (not directly to queue)
        // Internal Flow:
        // Producer → Exchange → (match routingKey) → Queue → Consumer (future)
        // Buffer.from() use hota hai kyunki RabbitMQ binary payload accept karta hai
        // JSON.stringify = JS object ko transferable format me convert karna
        channel.publish(exchange,routingKey,Buffer.from(JSON.stringify(message)));

        // Important: Yeh sirf confirm karta hai ki message broker ko send ho gaya
        // Yeh guarantee nahi deta ki consumer ne process bhi kar liya
        // (Reliability actual me ACK mechanism se aati hai - consumer side)
        console.log("Message was send succesfully")

        // Debug / Learning Logs:
        // Exchange value: metadata confirmation from broker
        // Queue value: shows backlog (messageCount) & active workers (consumerCount)
        // Binding value: empty object (protocol level acknowledgement)
        console.log(whatValueWillIget,channelValue,queueuValue)

        // Step 7: Graceful shutdown delay
        // Immediately connection close karne se message network buffer me stuck reh sakta hai
        // 500ms delay ensure karta hai ki AMQP frames broker tak flush ho jaye
        // Production me better approach: Confirm Channels + proper shutdown hooks
        setTimeout(()=>{
            connection.close();
        },500)

        
    } catch (error) {
        // Distributed system me common failure cases:
        // - RabbitMQ broker down
        // - Wrong URL/port (5672)
        // - Auth failure
        // - Exchange type mismatch (PRECONDITION_FAILED)
        console.log(error)
        
    }

}

// Entry Point: Yeh ek Producer Microservice ki tarah behave kar raha hai
// Real Architecture Example:
// User Service → publish "send_mail" event → RabbitMQ Queue → Email Worker Consumer
sendMail();