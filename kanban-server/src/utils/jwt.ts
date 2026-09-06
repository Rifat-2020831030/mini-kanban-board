import jwt from 'jsonwebtoken';


export interface JwtPayload {
  userId: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
}
