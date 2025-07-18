const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createTask = async (req, res) => {
  const { title, description, status } = req.body;
  const userId = req.user.userId;
  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (status && !["PENDING", "INPROGRESS", "COMPLETED"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Must be PENDING, INPROGRESS, or COMPLETED",
    });
  }
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "PENDING",
        userId,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating task", error: error.message });
  }
};

const getTasks = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;
  try {
    let tasks;
    if (role === "ADMIN") {
      tasks = await prisma.task.findMany({
        include: { user: { select: { email: true } } },
      });
    } else {
      tasks = await prisma.task.findMany({
        where: { userId },
        include: { user: { select: { email: true } } },
      });
    }
    res.json(tasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  const userId = req.user.userId;
  const role = req.user.role;
  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (status && !["PENDING", "INPROGRESS", "COMPLETED"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Must be PENDING, INPROGRESS, or COMPLETED",
    });
  }
  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.userId !== userId && role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { title, description, status },
    });
    res.json(updatedTask);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating task", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;
  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.userId !== userId && role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await prisma.task.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error deleting task", error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
