import { MagnifierIcon } from "./Icons";

const SearchField = () => (
<div className="relative flex items-center gap-2 border border-gray-500 rounded-lg p-2 bg-black text-gray-400">
{/* 🔍 Lupen-Icon */}
  <MagnifierIcon className="w-5 h-5" />

  {/* Placeholder mit "Type {Slash} to search" */}
  <span>Type</span>
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="white" strokeWidth="2"/> 
    <path d="M8 16L16 8" stroke="white" strokeWidth="2" strokeLinecap="round"/> 
  </svg>
  <span>to search</span>
  {/* Eingabefeld ohne Standard-Placeholder */}
  <input type="text" className="absolute inset-0 w-full bg-transparent outline-none caret-white px-2"/>
</div>
);

export { SearchField };