'use client';
import Link from 'next/link';
import { AudioLines } from 'lucide-react';
export default function Brand({href='/',minimal=false}){return <Link href={href} className="brand"><span className="brand-symbol"><AudioLines size={21} strokeWidth={2.5}/></span>{!minimal&&<span>insight<span className="brand-accent">live</span><small>INTERACTIVE PRESENTATIONS</small></span>}</Link>}
