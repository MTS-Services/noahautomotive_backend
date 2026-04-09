require("dotenv").config();
const app = require("./app");
const prisma = require("./config/database");

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    // app.listen(PORT, () => {
    //   console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    // });
    app.listen(PORT, () => {
      const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
      console.log(`🚀 Server running at ${baseUrl} [${process.env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
