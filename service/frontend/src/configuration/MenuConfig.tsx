
import { OverviewIcon, RepositoryIcon, ProjectIcon, StarIcon } from "@/components/Icons";

const commonMenu = [
  { name: "Overview", href: "/profile", icon: <OverviewIcon /> },
  { name: "Repositories", href: "/repositories", icon: <RepositoryIcon />, extra: 12 },
  { name: "Projects", href: "/projects", icon: <ProjectIcon /> },
  { name: "Stars", href: "/stars", icon: <StarIcon />, extra: 128 },
];

const menuItems: { [key: string]: typeof commonMenu } = {
  "/profile": commonMenu,
  "/repositories": commonMenu,
  "/discussions": commonMenu,
};

export { menuItems };