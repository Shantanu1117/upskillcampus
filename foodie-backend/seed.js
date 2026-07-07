require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Restaurant = require("./models/Restaurant");
const MenuItem = require("./models/MenuItem");
const Coupon = require("./models/Coupon");

async function seedCoupons() {
  const coupons = [
    {
      code: "FOOD20",
      description: "20% off your first order",
      type: "PERCENTAGE",
      value: 20,
      maxDiscount: 150,
      minimumOrderAmount: 99,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year out
    },
    {
      code: "FREEDEL",
      description: "Free delivery on your order",
      type: "FREE_DELIVERY",
      value: 0,
      minimumOrderAmount: 149,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const c of coupons) {
    const existing = await Coupon.findOne({ code: c.code });
    if (existing) {
      console.log(`⚠️  Coupon '${c.code}' already exists, skipping.`);
      continue;
    }
    await Coupon.create(c);
    console.log(`✅ Seeded coupon: ${c.code}`);
  }
}

async function seedRestaurantWithMenu(ownerId, restaurantData, menuItems) {
  const existing = await Restaurant.findOne({ name: restaurantData.name });
  let restaurant;

  if (existing) {
    console.log(`⚠️  '${restaurantData.name}' already exists, skipping restaurant insert.`);
    restaurant = existing;
  } else {
    restaurant = await Restaurant.create({ ...restaurantData, owner: ownerId });
    console.log("✅ Created restaurant:", restaurant.name, restaurant._id);
  }

  const existingItemCount = await MenuItem.countDocuments({ restaurant: restaurant._id });
  if (existingItemCount > 0) {
    console.log(`⚠️  '${restaurantData.name}' already has ${existingItemCount} menu items, skipping menu insert.`);
    return restaurant;
  }

  await MenuItem.insertMany(
    menuItems.map(item => ({ ...item, restaurant: restaurant._id }))
  );
  console.log(`✅ Added ${menuItems.length} menu items to ${restaurant.name}`);

  return restaurant;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Find or create a restaurant_owner user
    let owner = await User.findOne({ role: "restaurant_owner" });

    if (!owner) {
      owner = await User.create({
        name: "Test Owner",
        email: "owner@test.com",
        password: "password123",
        role: "restaurant_owner"
      });
      console.log("✅ Created owner user:", owner.email);
    } else {
      console.log("✅ Using existing owner:", owner.email);
    }

    // 2. Pizza Max — Pizza / Italian
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Pizza Max",
        cuisines: ["Pizza", "Italian"],
        coverImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
        address: {
          street: "12 MG Road",
          area: "Sector 5",
          city: "Rohini",
          state: "Delhi",
          pincode: "110085"
        },
        phone: "9876543210",
        rating: 4.2,
        deliveryTime: { min: 25, max: 35 },
        deliveryFee: 40,
        minimumOrder: 100,
        isActive: true,
        isVerified: true,
        isOpen: true
      },
      [
        {
          name: "Margherita Pizza",
          description: "Classic cheese and tomato pizza on a hand-tossed base",
          price: 249,
          discountedPrice: 199,
          category: "Pizza",
          image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
          isVeg: true,
          isBestSeller: true
        },
        {
          name: "Farmhouse Pizza",
          description: "Loaded with onion, capsicum, tomato and mushroom",
          price: 329,
          category: "Pizza",
          image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&q=80",
          isVeg: true
        },
        {
          name: "Pepperoni Pizza",
          description: "Double pepperoni with mozzarella",
          price: 379,
          category: "Pizza",
          image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80",
          isVeg: false,
          isBestSeller: true
        },
        {
          name: "Garlic Breadsticks",
          description: "Baked fresh with garlic butter and herbs",
          price: 149,
          category: "Sides",
          image: "https://images.unsplash.com/photo-1619531040576-f9416740661b?w=400&q=80",
          isVeg: true
        },
        {
          name: "Choco Lava Cake",
          description: "Warm chocolate cake with a molten center",
          price: 129,
          category: "Desserts",
          image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80",
          isVeg: true
        },
        {
          name: "Coke (500ml)",
          description: "Chilled and fizzy",
          price: 60,
          category: "Drinks",
          image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80",
          isVeg: true
        }
      ]
    );

    // 3. Burger Barn — Burger / American (so cuisine filtering has 2+ restaurants to work with)
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Burger Barn",
        cuisines: ["Burger", "Continental"],
        coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
        address: {
          street: "45 Ring Road",
          area: "Sector 12",
          city: "Rohini",
          state: "Delhi",
          pincode: "110086"
        },
        phone: "9876543211",
        rating: 4.5,
        deliveryTime: { min: 20, max: 30 },
        deliveryFee: 30,
        minimumOrder: 99,
        isActive: true,
        isVerified: true,
        isOpen: true
      },
      [
        {
          name: "Classic Cheeseburger",
          description: "Beef patty, cheddar, lettuce, tomato, house sauce",
          price: 189,
          category: "Burgers",
          image: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=400&q=80",
          isVeg: false,
          isBestSeller: true
        },
        {
          name: "Veggie Burger",
          description: "Crispy veggie patty with all the fixings",
          price: 159,
          category: "Burgers",
          image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80",
          isVeg: true
        },
        {
          name: "Loaded Fries",
          description: "Fries topped with cheese sauce and jalapeños",
          price: 129,
          category: "Sides",
          image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&q=80",
          isVeg: true
        },
        {
          name: "Chocolate Milkshake",
          description: "Thick and creamy",
          price: 99,
          category: "Drinks",
          image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&q=80",
          isVeg: true
        }
      ]
    );

    await seedCoupons();

    // 4. Biryani House — Biryani / North Indian
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Biryani House",
        cuisines: ["Biryani", "North Indian"],
        coverImage: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&q=80",
        address: { street: "8 Model Town", area: "Sector 3", city: "Rohini", state: "Delhi", pincode: "110085" },
        phone: "9876543212",
        rating: 4.4,
        deliveryTime: { min: 30, max: 40 },
        deliveryFee: 35,
        minimumOrder: 149,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Chicken Biryani", description: "Fragrant basmati rice layered with spiced chicken", price: 259, category: "Biryani", image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80", isVeg: false, isBestSeller: true },
        { name: "Veg Biryani", description: "Basmati rice with mixed vegetables and saffron", price: 199, category: "Biryani", image: "https://images.unsplash.com/photo-1701579231349-0f2e2b0c6c8a?w=400&q=80", isVeg: true },
        { name: "Butter Naan", description: "Soft leavened bread with butter", price: 49, category: "Breads", image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d8151?w=400&q=80", isVeg: true },
        { name: "Paneer Butter Masala", description: "Cottage cheese in rich tomato-butter gravy", price: 229, category: "Main Course", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80", isVeg: true, isBestSeller: true }
      ]
    );

    // 5. Dragon Wok — Chinese
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Dragon Wok",
        cuisines: ["Chinese"],
        coverImage: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80",
        address: { street: "21 Pitampura Road", area: "Sector 8", city: "Rohini", state: "Delhi", pincode: "110088" },
        phone: "9876543213",
        rating: 4.1,
        deliveryTime: { min: 25, max: 35 },
        deliveryFee: 35,
        minimumOrder: 129,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Veg Hakka Noodles", description: "Wok-tossed noodles with fresh vegetables", price: 179, category: "Noodles", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Chilli Chicken", description: "Crispy chicken tossed in spicy chilli sauce", price: 219, category: "Starters", image: "https://images.unsplash.com/photo-1626200926749-e9dd48e59f5c?w=400&q=80", isVeg: false },
        { name: "Veg Manchurian", description: "Fried vegetable balls in tangy Manchurian sauce", price: 169, category: "Starters", image: "https://images.unsplash.com/photo-1626200924543-5db51b3f3ba9?w=400&q=80", isVeg: true }
      ]
    );

    // 6. Dosa Point — South Indian
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Dosa Point",
        cuisines: ["South Indian"],
        coverImage: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80",
        address: { street: "5 Saraswati Vihar", area: "Sector 15", city: "Rohini", state: "Delhi", pincode: "110089" },
        phone: "9876543214",
        rating: 4.6,
        deliveryTime: { min: 20, max: 30 },
        deliveryFee: 30,
        minimumOrder: 99,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Masala Dosa", description: "Crispy rice crepe with spiced potato filling", price: 129, category: "Dosa", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Idli Sambar", description: "Steamed rice cakes with lentil sambar", price: 99, category: "Breakfast", image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80", isVeg: true },
        { name: "Filter Coffee", description: "South Indian style strong filter coffee", price: 49, category: "Drinks", image: "https://images.unsplash.com/photo-1621555653024-cd944ef15af9?w=400&q=80", isVeg: true }
      ]
    );

    // 7. Sweet Treats — Desserts
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Sweet Treats",
        cuisines: ["Desserts"],
        coverImage: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80",
        address: { street: "3 Ashok Vihar", area: "Sector 2", city: "Rohini", state: "Delhi", pincode: "110090" },
        phone: "9876543215",
        rating: 4.7,
        deliveryTime: { min: 20, max: 25 },
        deliveryFee: 25,
        minimumOrder: 79,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Chocolate Brownie", description: "Warm fudgy brownie with walnuts", price: 99, category: "Desserts", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Gulab Jamun (2 pc)", description: "Soft milk dumplings in sugar syrup", price: 69, category: "Desserts", image: "https://images.unsplash.com/photo-1615887101840-4c1a3b3d4d6e?w=400&q=80", isVeg: true },
        { name: "Belgian Waffle", description: "Crisp waffle with chocolate sauce and ice cream", price: 149, category: "Desserts", image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80", isVeg: true }
      ]
    );

    // 8. Fresh Squeeze — Drinks / Soft Drinks
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Fresh Squeeze",
        cuisines: ["Drinks", "Soft Drinks"],
        coverImage: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&q=80",
        address: { street: "17 Shalimar Bagh", area: "Sector 9", city: "Rohini", state: "Delhi", pincode: "110088" },
        phone: "9876543216",
        rating: 4.3,
        deliveryTime: { min: 15, max: 20 },
        deliveryFee: 20,
        minimumOrder: 49,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Fresh Orange Juice", description: "Cold-pressed, no added sugar", price: 89, category: "Juices", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Mango Smoothie", description: "Thick and creamy seasonal mango smoothie", price: 109, category: "Smoothies", image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80", isVeg: true },
        { name: "Cold Coffee", description: "Chilled, blended with ice cream", price: 99, category: "Drinks", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80", isVeg: true }
      ]
    );

    // 9. Spice Street — Street Food
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Spice Street",
        cuisines: ["Street Food"],
        coverImage: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
        address: { street: "9 Nangloi", area: "Sector 6", city: "Rohini", state: "Delhi", pincode: "110087" },
        phone: "9876543217",
        rating: 4.5,
        deliveryTime: { min: 20, max: 30 },
        deliveryFee: 25,
        minimumOrder: 79,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Pani Puri (6 pc)", description: "Crispy shells with spiced tangy water", price: 59, category: "Chaat", image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Pav Bhaji", description: "Spiced mashed vegetable curry with buttered buns", price: 119, category: "Street Food", image: "https://images.unsplash.com/photo-1606491956689-9c3f4f88b6f7?w=400&q=80", isVeg: true },
        { name: "Samosa Chaat", description: "Crushed samosas topped with chutneys and yogurt", price: 89, category: "Chaat", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80", isVeg: true }
      ]
    );

    // 10. Green Bowl — Healthy
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Green Bowl",
        cuisines: ["Healthy"],
        coverImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
        address: { street: "4 Prashant Vihar", area: "Sector 14", city: "Rohini", state: "Delhi", pincode: "110085" },
        phone: "9876543218",
        rating: 4.6,
        deliveryTime: { min: 20, max: 30 },
        deliveryFee: 30,
        minimumOrder: 149,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Quinoa Salad Bowl", description: "Quinoa, greens, chickpeas, lemon-tahini dressing", price: 219, category: "Salads", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Grilled Chicken Bowl", description: "Grilled chicken, brown rice, roasted veggies", price: 259, category: "Bowls", image: "https://images.unsplash.com/photo-1547496502-affa22d38842?w=400&q=80", isVeg: false },
        { name: "Avocado Toast", description: "Sourdough, smashed avocado, chili flakes", price: 189, category: "Breakfast", image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&q=80", isVeg: true }
      ]
    );

    // 11. Pasta Palace — Italian / Continental
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Pasta Palace",
        cuisines: ["Italian", "Continental"],
        coverImage: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80",
        address: { street: "11 Wazirpur", area: "Sector 11", city: "Rohini", state: "Delhi", pincode: "110086" },
        phone: "9876543219",
        rating: 4.4,
        deliveryTime: { min: 25, max: 35 },
        deliveryFee: 40,
        minimumOrder: 149,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Alfredo Pasta", description: "Creamy white sauce pasta with herbs", price: 229, category: "Pasta", image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Arrabbiata Pasta", description: "Spicy tomato and garlic pasta", price: 209, category: "Pasta", image: "https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&q=80", isVeg: true },
        { name: "Grilled Chicken Sandwich", description: "Grilled chicken breast, lettuce, mayo, toasted bun", price: 199, category: "Sandwiches", image: "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400&q=80", isVeg: false }
      ]
    );

    // 12. Punjabi Tadka — North Indian
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Punjabi Tadka",
        cuisines: ["North Indian"],
        coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
        address: { street: "6 Rani Bagh", area: "Sector 7", city: "Rohini", state: "Delhi", pincode: "110034" },
        phone: "9876543220",
        rating: 4.5,
        deliveryTime: { min: 30, max: 40 },
        deliveryFee: 35,
        minimumOrder: 149,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Dal Makhani", description: "Slow-cooked black lentils in butter and cream", price: 189, category: "Main Course", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Amritsari Kulcha", description: "Stuffed leavened bread with spiced potato", price: 99, category: "Breads", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80", isVeg: true },
        { name: "Tandoori Chicken (Half)", description: "Char-grilled chicken marinated in yogurt and spices", price: 249, category: "Starters", image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d8151?w=400&q=80", isVeg: false, isBestSeller: true }
      ]
    );

    // 13. Wok This Way — Chinese
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Wok This Way",
        cuisines: ["Chinese"],
        coverImage: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80",
        address: { street: "2 Kohat Enclave", area: "Sector 4", city: "Rohini", state: "Delhi", pincode: "110091" },
        phone: "9876543221",
        rating: 4.2,
        deliveryTime: { min: 25, max: 35 },
        deliveryFee: 30,
        minimumOrder: 99,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Schezwan Fried Rice", description: "Spicy wok-tossed rice with vegetables", price: 169, category: "Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Honey Chilli Potato", description: "Crispy potatoes tossed in sweet-spicy glaze", price: 149, category: "Starters", image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80", isVeg: true },
        { name: "Chicken Manchurian", description: "Fried chicken in tangy Manchurian sauce", price: 229, category: "Starters", image: "https://images.unsplash.com/photo-1626200924543-5db51b3f3ba9?w=400&q=80", isVeg: false }
      ]
    );

    // 14. The Sundae School — Desserts
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "The Sundae School",
        cuisines: ["Desserts"],
        coverImage: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=80",
        address: { street: "14 Sector 24", area: "Sector 24", city: "Rohini", state: "Delhi", pincode: "110085" },
        phone: "9876543222",
        rating: 4.8,
        deliveryTime: { min: 15, max: 25 },
        deliveryFee: 25,
        minimumOrder: 79,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Classic Sundae", description: "Vanilla ice cream, hot fudge, nuts, cherry", price: 129, category: "Desserts", image: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Cookie Dough Tub", description: "Cookie dough chunks in creamy vanilla base", price: 159, category: "Desserts", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80", isVeg: true },
        { name: "Kulfi Stick", description: "Traditional Indian frozen dessert, pistachio", price: 59, category: "Desserts", image: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=400&q=80", isVeg: true }
      ]
    );

    // 15. Chai Point Express — Drinks / Soft Drinks
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Chai Point Express",
        cuisines: ["Drinks", "Soft Drinks"],
        coverImage: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&q=80",
        address: { street: "19 Sector 20", area: "Sector 20", city: "Rohini", state: "Delhi", pincode: "110086" },
        phone: "9876543223",
        rating: 4.4,
        deliveryTime: { min: 10, max: 20 },
        deliveryFee: 20,
        minimumOrder: 39,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Masala Chai", description: "Freshly brewed spiced tea", price: 29, category: "Drinks", image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80", isVeg: true, isBestSeller: true },
        { name: "Iced Lemon Tea", description: "Refreshing chilled lemon tea", price: 59, category: "Drinks", image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80", isVeg: true },
        { name: "Bun Maska", description: "Soft bun with a generous layer of butter", price: 49, category: "Snacks", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80", isVeg: true }
      ]
    );

    // 16. Roll Junction — Street Food
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Roll Junction",
        cuisines: ["Street Food"],
        coverImage: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80",
        address: { street: "27 Sector 16", area: "Sector 16", city: "Rohini", state: "Delhi", pincode: "110089" },
        phone: "9876543224",
        rating: 4.6,
        deliveryTime: { min: 15, max: 25 },
        deliveryFee: 25,
        minimumOrder: 69,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "Chicken Kathi Roll", description: "Spiced chicken wrapped in a flaky paratha", price: 129, category: "Rolls", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80", isVeg: false, isBestSeller: true },
        { name: "Paneer Tikka Roll", description: "Grilled paneer with mint chutney, wrapped fresh", price: 109, category: "Rolls", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80", isVeg: true },
        { name: "Aloo Tikki Chaat", description: "Crispy potato patties with tangy chutneys", price: 79, category: "Chaat", image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80", isVeg: true }
      ]
    );

    // 17. Slice Society — Pizza (second option, for variety)
    await seedRestaurantWithMenu(
      owner._id,
      {
        name: "Slice Society",
        cuisines: ["Pizza", "Italian"],
        coverImage: "https://images.unsplash.com/photo-1548369937-47519962c11a?w=600&q=80",
        address: { street: "31 Sector 22", area: "Sector 22", city: "Rohini", state: "Delhi", pincode: "110086" },
        phone: "9876543225",
        rating: 4.3,
        deliveryTime: { min: 25, max: 35 },
        deliveryFee: 35,
        minimumOrder: 129,
        isActive: true, isVerified: true, isOpen: true
      },
      [
        { name: "BBQ Chicken Pizza", description: "Smoky BBQ chicken, red onion, mozzarella", price: 349, category: "Pizza", image: "https://images.unsplash.com/photo-1548369937-47519962c11a?w=400&q=80", isVeg: false, isBestSeller: true },
        { name: "Four Cheese Pizza", description: "Mozzarella, cheddar, parmesan, blue cheese", price: 329, category: "Pizza", image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&q=80", isVeg: true },
        { name: "Veggie Supreme Pizza", description: "Loaded with bell peppers, olives, corn, mushroom", price: 299, category: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80", isVeg: true }
      ]
    );

    console.log("\n🌱 Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();