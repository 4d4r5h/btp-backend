import express from "express";
import validator from "validator";
import Users from "../models/users.mjs";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    let { username, password, isAdmin } = req.body;
    username = username.trim();
    password = password.trim();
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        error: {
          name: "InvalidUsernameError",
          message:
            "Username should only contain letters, numbers, and underscores.",
        },
      });
    }
    if (!validator.isStrongPassword(password, { minLength: 6 })) {
      return res.status(400).json({
        error: {
          name: "WeakPasswordError",
          message:
            "Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character.",
        },
      });
    }
    const userExists = await Users.findOne({ username }).lean();
    if (userExists) {
      return res.status(400).json({
        error: {
          name: "DuplicateUsernameError",
          message: "Username already exists. Choose a different username.",
        },
      });
    }
    const request = {
      username: username,
      password: password,
      isAdmin: isAdmin,
    };
    const user = new Users(request);
    await user.save();
    const response = {
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
    };
    res.status(200).json(response);
    console.log(`Signup successful for username: ${response.username}.`);
  } catch (error) {
    res.status(500).json({
      error: {
        name: error.name,
        message: error.message,
      },
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    let { username, password, isAdmin } = req.body;
    username = username.trim();
    password = password.trim();
    const user = await Users.findOne({
      username: username,
      isAdmin: isAdmin,
    });
    if (!user) {
      return res.status(400).json({
        error: {
          name: "UserNotFoundError",
          message: "Username does not exist.",
        },
      });
    }
    const isMatch = await new Promise((resolve, reject) => {
      user.comparePassword(password, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
    if (!isMatch) {
      return res.status(400).json({
        error: {
          name: "InvalidPasswordError",
          message: "Invalid password.",
        },
      });
    }
    const response = {
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
    };
    res.status(200).json(response);
    console.log(`Login successful for username: ${response.username}.`);
  } catch (error) {
    res.status(500).json({
      error: {
        name: error.name,
        message: error.message,
      },
    });
  }
});

export default router;
