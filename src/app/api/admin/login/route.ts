import { NextResponse } from 'next/server';
import { createAdminSession, verifyPassword } from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){ try { const {username,password}=await req.json(); if(username!==process.env.ADMIN_USERNAME || !(await verifyPassword(String(password||'')))) return NextResponse.json({error:'Username atau password salah.'},{status:401}); await createAdminSession(); return NextResponse.json({success:true}); } catch { return NextResponse.json({error:'Login gagal.'},{status:500}); } }
