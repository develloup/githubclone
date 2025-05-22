
import { OverviewIcon, RepositoryIcon, ProjectIcon, StarIcon } from "@/components/Icons";

const commonMenu = [
  { name: "Overview", href: "/overview", icon: <OverviewIcon /> },
  { name: "Repositories", href: "/repositories", icon: <RepositoryIcon />, extra: 12 },
  { name: "Projects", href: "/projects", icon: <ProjectIcon /> },
  { name: "Stars", href: "/stars", icon: <StarIcon />, extra: 128 },
];

const menuItems: { [key: string]: typeof commonMenu } = {
  "/dashboard": commonMenu,
  "/profile": commonMenu,
  "/repositories": commonMenu,
  "/projects": commonMenu,
  "/issues": commonMenu,
  "/pulls": commonMenu,
  "/discussions": commonMenu,
};

export { menuItems };