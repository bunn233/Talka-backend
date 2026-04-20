import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
export function GET() { return Response.json({ok: !!bcrypt && !!nodemailer}) }
