import { prisma } from "./config/prisma";
import bcrypt from "bcrypt";

async function main() {
  const school = await prisma.school.create({
    data: {
      name: "Escola Teste",
      cnpj: "12.345.678/0001-99",
      slug: "escola-teste",
    },
  });

  await prisma.user.create({
    data: {
      schoolId: school.id,
      name: "Admin Teste",
      email: "admin@teste.com",
      passwordHash: await bcrypt.hash("senha123", 12),
      role: "SECRETARY",
    },
  });

  console.log("School ID:", school.id);
  console.log("Email: admin@teste.com | Senha: senha123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
