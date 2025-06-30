import { RepositoryLicenseInfo } from "@/types/typesRepository"
import { MarkdownViewer } from "../markdownviewer"
import { RepositoryFileTabs } from "./RepositoryFile/RepositoryFileTabs"
import { FileDetectionWithKey, FileDetection } from "@/lib/detectStandardFiles"


export type RepositoryFileProps = {
    tabList: FileDetectionWithKey[]
    activeTab: string
    activeFile: FileDetection
    fileHref: string
    licenseInfo: RepositoryLicenseInfo | null
    provider: string
    username: string
    reponame: string
    defbranch: string
}

export function RepositoryFile({
    tabList,
    activeTab,
    activeFile,
    fileHref,
    licenseInfo,
    provider,
    username,
    reponame,
    defbranch
}: RepositoryFileProps) {
    console.log("RepositoryFile")
    console.log("tabList:     ", tabList);
    console.log("activeTab:   ", activeTab);
    console.log("activeFile:  ", activeFile);
    console.log("fileHref:    ", fileHref);
    console.log("licenseInfo: ", licenseInfo);
    console.log("provider:    ", provider);
    console.log("username:    ", username);
    console.log("reponame:    ", reponame);
    console.log("defbranch:   ", defbranch);

    return (
        <div className="border rounded-md overflow-hidden">
            <div className="border rounded-md overflow-hidden">
                <RepositoryFileTabs
                    tabList={tabList}
                    activeTab={activeTab}
                    licenseInfo={licenseInfo}
                    fileHref={fileHref}
                />
                {activeFile !== undefined && (
                    <MarkdownViewer
                        id={`${activeFile.category}-ov-file`}
                        provider={provider}
                        owner={username}
                        name={reponame}
                        contentPath={activeFile.filename}
                        ref={defbranch}
                    />
                )}
            </div>
        </div>
    )
}
