import { RepositoryAbout } from "./RepositoryRight/RepositoryAbout"
import { RepositoryContributorsSection } from "./RepositoryRight/RepositoryContributorsSections"
import { RepositoryDeploymentsSection } from "./RepositoryRight/RepositoryDeploymentsSection"
import { RepositoryDetectedFiles } from "./RepositoryRight/RepositoryDetectedFiles"
import { RepositoryFacts } from "./RepositoryRight/RepositoryFacts"
import { RepositoryLanguagesSection } from "./RepositoryRight/RepositoryLanguagesSection"
import { RepositoryReleasesSection } from "./RepositoryRight/RepositoryReleasesSection"
import { ExtendedRepository, RepositoryCollaborators } from "@/types/typesRepository"

export type RepositoryRightProps = {
    repository: ExtendedRepository
    contributors: RepositoryCollaborators | undefined;
    detectedFiles: { category: string; filename: string }[]
    currentPath: string
}

export function RepositoryRight({
    repository,
    contributors,
    detectedFiles,
    currentPath
}: RepositoryRightProps) {
    return (
        <section className="space-y-6">
            <RepositoryAbout description={repository.description} />
            <RepositoryDetectedFiles
                files={detectedFiles}
                licenseInfo={repository.licenseInfo}
                currentPath={currentPath}
            />
            <RepositoryFacts
                currentPath={currentPath}
                stargazers={repository.stargazerCount}
                watchers={repository.watchers.totalCount}
                forks={repository.forkCount}
            />
            <RepositoryReleasesSection
                releases={repository.releases}
                currentPath={currentPath}
            />
            <RepositoryContributorsSection contributors={contributors}/>
            <RepositoryDeploymentsSection deployments={repository.deployments} />
            <RepositoryLanguagesSection languages={repository.languages} />
        </section>
    )
}
