const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

const VALID_ROLES = ["CUSTOMER", "ADMIN"];

function safeUserSelect() {
  return { id: true, name: true, email: true, role: true, isActive: true, phone: true, deliveryAddress: true, createdAt: true };
}

function validateAccount(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = typeof body?.role === "string" ? body.role.toUpperCase() : "CUSTOMER";

  if (name.length < 2 || name.length > 80) return { error: "Name must be between 2 and 80 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: "Enter a valid email address." };
  if (password.length < 8 || password.length > 72) return { error: "Password must be between 8 and 72 characters." };
  if (!VALID_ROLES.includes(role)) return { error: "Choose CUSTOMER or ADMIN as the account role." };
  return { data: { name, email, password, role } };
}

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: safeUserSelect(),
      orderBy: { createdAt: "desc" },
    });
    return res.json({ status: "success", count: users.length, data: users });
  } catch (error) {
    console.error("Failed to list users:", error);
    return res.status(500).json({ status: "error", message: "Could not load users right now." });
  }
}

async function createUser(req, res) {
  const validation = validateAccount(req.body || {});
  if (validation.error) return res.status(400).json({ status: "error", message: validation.error });

  try {
    const password = await bcrypt.hash(validation.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: validation.data.name,
        email: validation.data.email,
        password,
        role: validation.data.role,
      },
      select: safeUserSelect(),
    });
    return res.status(201).json({
      status: "success",
      message: validation.data.role === "ADMIN" ? "Administrator account created." : "Customer account created.",
      data: user,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ status: "error", message: "An account with this email already exists." });
    }
    console.error("Failed to create user:", error);
    return res.status(500).json({ status: "error", message: "Could not create this account right now." });
  }
}

async function updateUserRole(req, res) {
  const id = Number(req.params.id);
  const role = typeof req.body?.role === "string" ? req.body.role.toUpperCase() : "";

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ status: "error", message: "Invalid user ID." });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ status: "error", message: "Choose CUSTOMER or ADMIN as the account role." });
  }
  if (id === req.user.userId) {
    return res.status(400).json({ status: "error", message: "You cannot change your own role. Ask another administrator to do this." });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) return res.status(404).json({ status: "error", message: "User not found." });

    if (target.role === "ADMIN" && target.isActive && role === "CUSTOMER") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (adminCount <= 1) {
        return res.status(409).json({ status: "error", message: "CafeServe must keep at least one administrator." });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: safeUserSelect(),
    });
    return res.json({ status: "success", message: `User role updated to ${role}.`, data: user });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return res.status(500).json({ status: "error", message: "Could not update this user's role." });
  }
}


async function updateUserStatus(req, res) {
  const id = Number(req.params.id);
  const isActive = req.body?.isActive;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ status: "error", message: "Invalid user ID." });
  }
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ status: "error", message: "Account status must be true (active) or false (disabled)." });
  }
  if (id === req.user.userId && !isActive) {
    return res.status(400).json({ status: "error", message: "You cannot disable your own account." });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, isActive: true },
    });
    if (!target) return res.status(404).json({ status: "error", message: "User not found." });

    if (target.role === "ADMIN" && target.isActive && !isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      });
      if (activeAdminCount <= 1) {
        return res.status(409).json({
          status: "error",
          message: "You cannot disable the last active administrator. CafeServe must keep at least one active admin.",
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: safeUserSelect(),
    });
    return res.json({
      status: "success",
      message: isActive ? "Account reactivated successfully." : "Account disabled. Existing order history has been preserved.",
      data: user,
    });
  } catch (error) {
    console.error("Failed to update user status:", error);
    return res.status(500).json({ status: "error", message: "Could not update this account's status." });
  }
}

async function deleteUser(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ status: "error", message: "Invalid user ID." });
  }
  if (id === req.user.userId) {
    return res.status(400).json({ status: "error", message: "You cannot delete your own account while signed in. Ask another administrator to manage it." });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, isActive: true, _count: { select: { orders: true } } },
    });
    if (!target) return res.status(404).json({ status: "error", message: "User not found." });

    if (target.role === "ADMIN" && target.isActive) {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (adminCount <= 1) {
        return res.status(409).json({ status: "error", message: "You cannot delete the last administrator. CafeServe must keep at least one admin." });
      }
    }

    if (target._count.orders > 0) {
      return res.status(409).json({
        status: "error",
        message: `This account has ${target._count.orders} order(s), so it cannot be deleted. Use Disable Account to block access while preserving order history.`,
      });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ status: "success", message: `${target.role === "ADMIN" ? "Administrator" : "User"} account deleted.`, data: { id: target.id } });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return res.status(500).json({ status: "error", message: "Could not delete this account right now." });
  }
}

module.exports = { listUsers, createUser, updateUserRole, updateUserStatus, deleteUser };
