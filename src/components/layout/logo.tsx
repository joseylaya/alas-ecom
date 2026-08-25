import Image from "next/image";
import Link from "next/link";

export function Logo({ size = "header" }: { size?: "header" | "footer" | "checkout" }) {
  const dimensions = size === "checkout" ? "h-14 w-[165px] md:h-16 md:w-[190px]" : size === "footer" ? "h-9 w-[106px]" : "h-5 w-[59px] md:h-6 md:w-[65px]";
  return <Link href="/" aria-label="ALAS home" className={`relative block shrink-0 ${dimensions}`}><Image src="/alas-logo.png" alt="ALAS" fill priority={size === "header"} className="object-contain" sizes={size === "checkout" ? "190px" : "118px"} /></Link>;
}
