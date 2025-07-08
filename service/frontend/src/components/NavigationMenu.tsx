import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/configuration/MenuConfig";
import {Button} from "@/components/ui/button"

const NavigationMenu = () => {
  const pathname = usePathname();
  const currentMenu = menuItems[pathname];

  // Falls kein Menü für die aktuelle Seite definiert ist, nichts rendern.
  if (!currentMenu) return null;

  return (
    <nav className="flex items-center justify-start px-4 py-2 text-base space-x-4">
      {currentMenu.map(({ name, href, icon, extra }) => (
        <Link key={href} href={href} className="flex items-center space-x-2">
          {icon && <span className="text-lg">{icon}</span>}
          <Button variant="ghost">{name}</Button>
          {extra && <span className="text-sm text-gray-500">{extra}</span>}
        </Link>
      ))}
    </nav>
  );
};

export default NavigationMenu;
