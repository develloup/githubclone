import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet"; // Passe den Import je nach Projektstruktur an
import { Button } from "./ui/button"; // Button-Komponente
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // Falls benötigt
import Image from "next/image";
import { GistIcon, ProfileIcon, ProjectIcon, RepositoryIcon, SettingIcon, SignInIcon, SignOutIcon, SmileyIcon, StarIcon, UserIcon } from "./Icons";
import { OAuthUser, User } from "@/types/types";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import UserStatusDialog from "./UserStatusDialog";

const RightMenu = ({ user, oauthUrls, oauthStatus, oauthuser, handleOAuthLogin, handleLogout }: {
  user: User;
  oauthUrls: { [key: string]: string };
  oauthStatus: { [key: string]: boolean };
  oauthuser: { [key: string]: OAuthUser };
  handleOAuthLogin: (provider: string) => void;
  handleLogout: () => void;
}) => {
    const pathname = usePathname();
    const [rightOpen, setRightOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  
    useEffect(() => {
      setRightOpen(false); // Closes the sheet if the path changes
    }, [pathname]);
  
  return (
    <Sheet open={rightOpen} onOpenChange={(isOpen) => setRightOpen(isOpen)}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="rounded-lg p-2 ml-4">
          <UserIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="rounded-lg">
        <VisuallyHidden>
          <SheetTitle><h2>User Menu</h2></SheetTitle>
          <SheetDescription>The user menu with user-related functionality.</SheetDescription>
        </VisuallyHidden>
        <p className="text-sm font-bold mt-4 ml-4">{user?.username}</p>
        <div className="flex flex-col space-y-1 mt-1">
            <Button variant="ghost" className="w-full justify-start text-left pl-3" onClick={() => setStatusDialogOpen(true)}><SmileyIcon/>Set status</Button>
            {statusDialogOpen && <UserStatusDialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} />}
        </div>
        <div className="h-px bg-gray-400 mt-0 my-1 mx-2" />
        <div className="flex flex-col space-y-1 mt-1">
            <Link href="/profile" passHref onClick={() => setRightOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-left pl-3"><ProfileIcon/>Your profile</Button>
            </Link>
            <Link href="/repositories" passHref onClick={() => setRightOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-left pl-3"><RepositoryIcon/>Your repositories</Button>
            </Link>
            <Link href="/projects" passHref onClick={() => setRightOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-left pl-3"><ProjectIcon/>Your projects</Button>
            </Link>
            <Link href="/stars" passHref onClick={() => setRightOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-left pl-3"><StarIcon/>Your stars</Button>
            </Link>
            <Link href="/gists" passHref onClick={() => setRightOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-left pl-3"><GistIcon/>Your gists</Button>
            </Link>
        </div>
        {oauthUrls && (
            <div className="flex flex-col">
                {/* Separator and title are integrated in the block */}
                <div className="h-px bg-gray-400 mt-0 my-1 mx-2" />
                <div className="flex items-center">
                    <span className="text-xs font-semibold pl-3 mt-5 mb-3">OAuth accounts</span>
                </div>

                {Object.keys(oauthUrls).map((provider) => {
                const isActive = oauthStatus[provider];
                const userData = oauthuser[provider]?.data?.viewer;
                const shouldSignIn = !isActive || !userData;

                return (
                    <Button
                    key={provider}
                    variant="ghost"
                    className="w-full justify-start text-left pl-3 flex items-center gap-2"
                    onClick={shouldSignIn ? () => handleOAuthLogin(provider) : undefined}
                    >
                    {shouldSignIn ? (
                        <>
                        <SignInIcon />
                        <p className="text-sm">{provider}</p>
                        </>
                    ) : (
                        <>
                        <Image 
                            src={userData.avatarUrl}
                            alt={userData.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                            unoptimized={true}
                        />
                        <p className="text-sm">{userData.login}</p>
                        </>
                    )}
                    </Button>
                );
                })}
            </div>
        )}
        <div className="h-px bg-gray-400 mt-0 my-1 mx-2" />
        <div className="flex flex-col space-y-1 mt-1">
            <Link href="/settings" passHref onClick={() => setRightOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-left pl-3"><SettingIcon/>Settings</Button>
            </Link>
        </div>
        <div className="h-px bg-gray-400 mt-0 my-1 mx-2" />
        <div className="flex flex-col space-y-1 mt-1">
            <Button variant="ghost" className="w-full justify-start text-left pl-3" onClick={handleLogout}><SignOutIcon/>Sign Out</Button>
        </div>


      </SheetContent>
    </Sheet>
  );
};

export default RightMenu;
