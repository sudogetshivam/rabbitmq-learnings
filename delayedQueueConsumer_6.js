const amqp = require("amqplib");

async function updateOrderStatus(batchId){
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Order Statuses Updated to "Started Shipping for batch : ${batchId}"`);
            resolve();
        }, 1000);
    });
}

async function processOrderUpdates() {
    try {
        const connection = await amqp.connect("amqp://localhost");
        const channel = await connection.createChannel();

        const queue = "delayed_order_updates_queue";

        await channel.assertQueue(queue, { durable: true });

        console.log("Waiting for messages");

        channel.consume(queue, async (message) => {
            if (!message) return;

            const { batchId } = JSON.parse(message.content.toString());
            console.log(`Processing order update task for batch: ${batchId}`);

            await updateOrderStatus(batchId);
            channel.ack(message);
        }, { noAck: false });

    } catch (error) {
        console.error(error);
    }
}

processOrderUpdates();