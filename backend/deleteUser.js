const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://victomblack2020:xWoIYboijhEjLD1y@cluster0.ve9baim.mongodb.net/MXHBee";

function randomDate() {
    // Chọn tháng 7 hoặc 8 năm 2025
    const month = Math.random() < 0.5 ? 6 : 7; // 0-based: 6=July, 7=August
    const day = Math.floor(Math.random() * 31) + 1;
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    return new Date(2025, month, day, hour, minute, second);
}

async function main() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db("MXHBee");
        const collections = await db.listCollections().toArray();

        for (const col of collections) {
            const collection = db.collection(col.name);
            const cursor = collection.find({});
            while (await cursor.hasNext()) {
                const doc = await cursor.next();
                const newCreatedAt = randomDate();
                const newUpdatedAt = randomDate();
                await collection.updateOne(
                    { _id: doc._id },
                    {
                        $set: {
                            createdAt: newCreatedAt,
                            updatedAt: newUpdatedAt,
                        },
                    }
                );
            }
            console.log(`Đã cập nhật xong collection: ${col.name}`);
        }
        console.log("Hoàn tất cập nhật thời gian!");
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

main();