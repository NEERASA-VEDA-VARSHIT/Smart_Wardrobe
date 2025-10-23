import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import { generateToken } from "../config/token.js";

export const signUp = async (req, res) => {
  try {
    console.log("Received signup data:", req.body);
    const { name, email, password, username: providedUsername } = req.body;

    if(!name || !email || !password){
        console.log("Missing fields - name:", !!name, "email:", !!email, "password:", !!password);
        return res.status(400).json({message: "All fields are required"});
    }

    console.log("All fields present, checking existing user...");
    // check if user already exists
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      console.log("User already exists with email:", email);
      return res.status(400).json({ message: "User already exists" });
    }
    console.log("No existing user found, checking password length...");
    if(password.length < 6){
      console.log("Password too short:", password.length);
      return res.status(400).json({message: "Password must be at least 6 characters"});
    }

    console.log("Password length OK, hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Creating user...");
    // Use provided username or generate from email
    let username = providedUsername || email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    
    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
    }
    
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: "Username must be between 3 and 30 characters" });
    }
    
    // Check if username already exists, if so, add a number
    let counter = 1;
    let originalUsername = username;
    while (await User.findOne({ username })) {
      username = `${originalUsername}${counter}`;
      counter++;
    }
    
    const user = await User.create({name, email, username, password: hashedPassword})
    console.log("User created successfully:", user._id);
    const token = await generateToken(user._id);
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? "strict" : "lax", 
      maxAge: 30*24*60*60*1000 
    });
    console.log("Sending success response...");
    res.status(201).json({message: "User created successfully", user});
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({message: "Internal server error", error: error.message});
  }
}

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  if(!email || !password){
    return res.status(400).json({message: "All fields are required"});
  }

  const user = await User.findOne({ email });
  if(!user){
    return res.status(400).json({message: "User does not exist"});
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if(!isMatch){
    return res.status(400).json({message: "Invalid credentials"});
  }

  const token = await generateToken(user._id);
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? "strict" : "lax", 
      maxAge: 30*24*60*60*1000 
    });

  res.status(200).json({ user, message: "User signed in successfully" });
}

export const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "strict"
    });
    
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}