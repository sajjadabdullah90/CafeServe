const prisma = require("../src/config/prisma");

const categories = [
  { name: "Burgers", items: [
    { name: "Classic Smash Burger", description: "Double smashed beef, cheddar, pickles, and our house sauce.", price: "1290.00", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85" },
    { name: "Crispy Chicken Burger", description: "Golden crispy chicken, fresh lettuce, and pepper mayo.", price: "1090.00", image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=900&q=85" },
    { name: "BBQ Baconless Burger", description: "Juicy beef patty, smoky BBQ glaze, onion, and melted cheese.", price: "1390.00", image: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?auto=format&fit=crop&w=900&q=85" }
  ]},
  { name: "Pizza", items: [
    { name: "Margherita Pizza", description: "Tomato, mozzarella, basil, and a crisp stone-baked crust.", price: "1490.00", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85" },
    { name: "Smoky Chicken Pizza", description: "Grilled chicken, peppers, red onion, and smoky sauce.", price: "1890.00", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85" }
  ]},
  { name: "Sides", items: [
    { name: "Loaded Fries", description: "Crispy fries with cheese sauce, herbs, and house seasoning.", price: "690.00", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85" },
    { name: "Crispy Onion Rings", description: "Golden, crunchy onion rings served with a tangy dip.", price: "590.00", image: "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=85" }
  ]},
  { name: "Drinks", items: [
    { name: "Iced Lemon Cooler", description: "Fresh lemon, mint, and sparkling refreshment.", price: "390.00", image: "https://images.unsplash.com/photo-1513558161293-cdaf765edfd?auto=format&fit=crop&w=900&q=85" },
    { name: "Chocolate Shake", description: "Creamy chocolate shake finished with a cocoa dusting.", price: "650.00", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=85" }
  ]}
];

async function main() {
  let created = 0;
  for (const group of categories) {
    const category = await prisma.category.upsert({
      where: { name: group.name },
      update: {},
      create: { name: group.name }
    });

    for (const item of group.items) {
      const existing = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id }
      });
      if (existing) {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: { ...item, available: true }
        });
      } else {
        await prisma.menuItem.create({
          data: { ...item, categoryId: category.id }
        });
        created += 1;
      }
    }
  }
  console.log(`CafeServe seed complete. Added ${created} new menu items.`);
}

main()
  .catch((error) => {
    console.error("CafeServe seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
