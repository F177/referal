// /app/api/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password, role } = body;

    if (!email || !password || !role) {
      return new NextResponse('Missing fields', { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse('User already exists', { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role === 'BRAND' ? UserRole.BRAND : UserRole.CREATOR,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("REGISTRATION_ERROR", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}