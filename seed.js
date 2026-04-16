const mongoose = require('mongoose');

const uri = "mongodb+srv://tuananh88:tuananh88@cluster-web93.ef5lars.mongodb.net/SPCK-X41";

const productSchema = new mongoose.Schema({
    name: String,
    slug: String,
    description: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    category: String,
    images: [String],
    stock: Number,
    rating: { type: Number, default: 0 },
    soldPercentage: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');

const CATEGORIES = {
    'Electronics': [
        'Sony WH-1000XM4 Wireless Headphones', 'Apple AirPods Pro', 'Samsung Galaxy Watch 5',
        'Mechanical Gaming Keyboard', 'Logitech MX Master 3 Mouse', 'Nintendo Switch OLED',
        'Dell UltraSharp 4K Monitor', 'Razer Blade 15 Gaming Laptop', 'Anker PowerCore 20000mAh',
        'GoPro HERO11 Black'
    ],
    'Fashion': [
        'Men\'s Classic Fit Suit', 'Nike Air Force 1 Sneakers', 'Vintage Denim Jacket',
        'Women\'s Floral Summer Dress', 'Adidas Ultraboost Running Shoes', 'Leather Crossbody Bag',
        'Polarized Aviator Sunglasses', 'Cotton Basic T-Shirt 3-Pack', 'Cashmere Winter Scarf',
        'Waterproof Trench Coat'
    ],
    'Home & Kitchen': [
        'Nespresso Vertuo Coffee Machine', 'Dyson V11 Absolute Vacuum', 'Instant Pot Duo 7-in-1',
        'Ninja Professional Blender', 'Satin Bed Sheets Set', 'Ergonomic Office Chair',
        'Philips Hue Smart Bulb', 'Cast Iron Dutch Oven', 'Bamboo Cutting Board Set',
        'Ceramic Non-Stick Frying Pan'
    ],
    'Beauty & Personal Care': [
        'Dyson Airwrap Styler', 'Olaplex Hair Perfector No.3', 'Cetaphil Daily Facial Cleanser',
        'Maybelline Lash Sensational Mascara', 'Philips Sonicare Electric Toothbrush',
        "L'Occitane Shea Butter Hand Cream", 'CeraVe Moisturizing Cream', 'Jade Roller and Gua Sha Set',
        'SK-II Facial Treatment Essence', 'La Mer Crème de la Mer'
    ]
};

const categoryKeys = Object.keys(CATEGORIES);

async function seed() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to DB");

        // Remove the previous fake products
        const deleteResult = await Product.deleteMany({ name: { $regex: /Fake/i } });
        console.log(`Deleted ${deleteResult.deletedCount} old fake products`);

        const products = [];
        let counter = 1;

        for (let i = 0; i < 50; i++) {
            const category = categoryKeys[i % 4];
            const namesArray = CATEGORIES[category];
            // pick a random name from the category list
            const baseName = namesArray[Math.floor(Math.random() * namesArray.length)];
            const productName = `${baseName} (Fake ${counter})`; // Append fake counter just to keep them unique

            const originalPrice = Math.floor(Math.random() * 500) + 50;
            const discount = Math.floor(Math.random() * 30);
            const price = originalPrice * (1 - discount / 100);

            products.push({
                name: productName,
                slug: `random-product-${Date.now()}-${counter}`,
                description: `This is a high-quality ${baseName} designed to provide the best experience for ${category} enthusiasts. Enjoy premium materials and top-tier build quality.`,
                price: parseFloat(price.toFixed(2)),
                originalPrice,
                discount,
                category: category,
                // generate random image per product by seeding picsum with a unique string
                images: [`https://picsum.photos/seed/${category.replace(/\s/g, '')}${counter}/500/500`],
                stock: Math.floor(Math.random() * 100) + 10,
                rating: parseFloat((4 + Math.random()).toFixed(1)), // random rating between 4.0 and 5.0
                soldPercentage: Math.floor(Math.random() * 100),
                totalSold: Math.floor(Math.random() * 1000)
            });
            counter++;
        }

        await Product.insertMany(products);
        console.log("Successfully inserted 50 realistic fake products");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
