import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.entry.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();

  const categoryData = [
    {
      name: "工作",
      order: 1,
      color: "#3b82f6",
      items: [
        { name: "專案開發", order: 1 },
        { name: "會議", order: 2 },
        { name: "學習", order: 3 },
      ],
    },
    {
      name: "健康",
      order: 2,
      color: "#22c55e",
      items: [
        { name: "運動", order: 1 },
        { name: "睡眠", order: 2 },
        { name: "飲食", order: 3 },
      ],
    },
    {
      name: "生活",
      order: 3,
      color: "#f59e0b",
      items: [
        { name: "家務", order: 1 },
        { name: "娛樂", order: 2 },
        { name: "社交", order: 3 },
      ],
    },
  ];

  for (const category of categoryData) {
    const created = await prisma.category.create({
      data: {
        name: category.name,
        order: category.order,
        color: category.color,
        items: {
          create: category.items,
        },
      },
    });

    const firstItem = await prisma.item.findFirst({
      where: { categoryId: created.id },
      orderBy: { order: "asc" },
    });

    if (firstItem) {
      await prisma.entry.create({
        data: {
          entryDate: new Date(),
          categoryId: created.id,
          itemId: firstItem.id,
          content: `${category.name} 範例紀錄`,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
