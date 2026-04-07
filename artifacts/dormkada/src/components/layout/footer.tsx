import { Link } from "wouter";
import logoPath from "@assets/logo_1775521822256.jpg";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <img src={logoPath} alt="DormKada" className="h-8 w-8 rounded bg-white p-1" />
            <span className="font-bold text-xl text-white">DormKada</span>
          </div>
          <p className="text-sm text-slate-400">
            Your trusted platform for finding the perfect boarding house in Brgy. Tanza, Boac, Marinduque.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">Quick Links</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
            <li><Link href="/listings" className="hover:text-amber-400 transition-colors">Browse Listings</Link></li>
            <li><Link href="/about" className="hover:text-amber-400 transition-colors">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">For Landlords</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/register" className="hover:text-amber-400 transition-colors">List Your Property</Link></li>
            <li><Link href="/login" className="hover:text-amber-400 transition-colors">Owner Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Contact</h4>
          <ul className="flex flex-col gap-2 text-sm text-slate-400">
            <li>Email: support@dormkada.com</li>
            <li>Phone: +63 900 000 0000</li>
            <li>Location: Brgy. Tanza, Boac, Marinduque</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} DormKada. All rights reserved.
      </div>
    </footer>
  );
}
