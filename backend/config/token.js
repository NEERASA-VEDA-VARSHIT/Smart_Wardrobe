import jwt from "jsonwebtoken";

export const generateToken = async (id) =>{
    try {
        const token = jwt.sign({id}, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
        return token;
    } catch (error) {
        throw new Error("Error generating token");
    }
}



export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};