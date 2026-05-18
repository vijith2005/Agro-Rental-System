const STORAGE_KEYS = {
  equipments: "equipments",
  rentals: "rentals",
  invoices: "invoices",
  chats: "chats",
};

export const getStored = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const setStored = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const seedData = () => {
  const existing = getStored(STORAGE_KEYS.equipments, null);
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return;
  }

  const equipments = [
    {
      id: "eq-tractor-35",
      name: "Tractor 35HP",
      category: "Tractor",
      description: "Powerful 35HP tractor suitable for ploughing and general farm work.",
      day: 800,
      week: 5200,
      month: 20000,
      location: "Coimbatore",
      rating: 4.7,
      imageKey: "hero",
      ownerId: "owner@demo.com",
      ownerName: "Kumar",
      lat: 11.0168,
      lng: 76.9558,
    },
    {
      id: "eq-harvester-combine",
      name: "Combine Harvester",
      category: "Harvester",
      description: "Modern combine harvester for wheat and rice harvesting.",
      day: 2500,
      week: 16000,
      month: 60000,
      location: "Erode",
      rating: 4.9,
      imageKey: "farmer",
      ownerId: "owner@demo.com",
      ownerName: "Kumar",
      lat: 11.3410,
      lng: 77.7172,
    },
    {
      id: "eq-cutter-crop",
      name: "Crop Cutting Machine",
      category: "Cutter",
      description: "Efficient crop cutting machine for paddy and wheat.",
      day: 600,
      week: 3800,
      month: 14000,
      location: "Salem",
      rating: 4.5,
      imageKey: "hero",
      ownerId: "owner@demo.com",
      ownerName: "Kumar",
      lat: 11.6643,
      lng: 78.1460,
    },
    {
      id: "eq-sprayer-450",
      name: "Boom Sprayer 450L",
      category: "Sprayer",
      description: "High-capacity sprayer with uniform coverage and low fuel usage.",
      day: 700,
      week: 4400,
      month: 16000,
      location: "Namakkal",
      rating: 4.6,
      imageKey: "farmer",
      ownerId: "owner@demo.com",
      ownerName: "Kumar",
      lat: 11.2206,
      lng: 78.1677,
    },
    {
      id: "eq-seeder-compact",
      name: "Compact Seed Drill",
      category: "Seeder",
      description: "Precision seed drill for small to mid-size farms.",
      day: 500,
      week: 3200,
      month: 12000,
      location: "Madurai",
      rating: 4.4,
      imageKey: "hero",
      ownerId: "owner@demo.com",
      ownerName: "Kumar",
      lat: 9.9252,
      lng: 78.1198,
    },
    {
      id: "eq-pump-irrigation",
      name: "Irrigation Pump 5HP",
      category: "Pump",
      description: "Energy-efficient pump for irrigation and water transfer.",
      day: 350,
      week: 2200,
      month: 9000,
      location: "Thanjavur",
      rating: 4.3,
      imageKey: "farmer",
      ownerId: "owner@demo.com",
      ownerName: "Kumar",
      lat: 10.7905,
      lng: 79.1391,
    },
  ];

  setStored(STORAGE_KEYS.equipments, equipments);
  setStored(STORAGE_KEYS.rentals, []);
  setStored(STORAGE_KEYS.invoices, []);

  try {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.length === 0) {
      users.push({
        name: "Owner Demo",
        email: "owner@demo.com",
        password: "owner123",
        role: "owner",
        phone: "9876543210",
        createdAt: new Date().toISOString(),
      });
      users.push({
        name: "Delivery Demo",
        email: "delivery@demo.com",
        password: "delivery123",
        role: "delivery",
        phone: "9876543211",
        createdAt: new Date().toISOString(),
      });
      users.push({
        name: "Admin Demo",
        email: "admin@demo.com",
        password: "admin123",
        role: "admin",
        phone: "9876543212",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("users", JSON.stringify(users));
    }
  } catch {
    // Ignore seed errors for users.
  }
};

export { STORAGE_KEYS };
