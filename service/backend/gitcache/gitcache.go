package gitcache

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
)

type RepoStatus string

const (
	StatusPending RepoStatus = "pending"
	StatusCloning RepoStatus = "cloning"
	StatusReady   RepoStatus = "ready"
	StatusError   RepoStatus = "error"
)

var (
	repoStatus    sync.Map // map[string]RepoStatus
	repoLocks     = make(map[string]*sync.Mutex)
	repoLocksLock sync.Mutex // protects repoLocks map
)

// --- Status Management ---

func setStatus(repoID string, status RepoStatus) {
	log.Printf("setStatus: %s, %v", repoID, status)
	repoStatus.Store(repoID, status)
}

func GetStatus(repoURL string) RepoStatus {
	repoID := SanitizeRepoID(repoURL)
	val, ok := repoStatus.Load(repoID)
	if !ok {
		return StatusPending
	}
	return val.(RepoStatus)
}

// --- Lock Management ---

func getOrCreateRepoLock(repoID string) *sync.Mutex {
	repoLocksLock.Lock()
	defer repoLocksLock.Unlock()

	if m, ok := repoLocks[repoID]; ok {
		return m
	}

	m := &sync.Mutex{}
	repoLocks[repoID] = m
	return m
}

func releaseRepoLock(repoID string) {
	repoLocksLock.Lock()
	defer repoLocksLock.Unlock()
	delete(repoLocks, repoID)
}

// --- Repo Trigger ---

func TriggerClone(repoURL string) {
	log.Printf("TriggerClone: %s", repoURL)
	repoID := SanitizeRepoID(repoURL)
	current := GetStatus(repoURL)
	if current == StatusCloning {
		log.Printf("Already cloning: %s", repoURL)
		return
	}

	setStatus(repoID, StatusCloning)

	go func() {
		lock := getOrCreateRepoLock(repoID)
		lock.Lock()
		defer func() {
			lock.Unlock()
			releaseRepoLock(repoID)
		}()

		err := ensureBareRepo(repoURL, getGitCacheDir())
		if err != nil {
			log.Printf("Clone failed for %s: %v", repoURL, err)
			setStatus(repoID, StatusError)
			return
		}

		setStatus(repoID, StatusReady)
		log.Printf("Clone complete for %s", repoURL)
	}()
}

// --- Repo Access ---

func AccessRepo(repoURL string, action func(repoPath string) error) error {
	repoID := SanitizeRepoID(repoURL)
	lock := getOrCreateRepoLock(repoID)
	lock.Lock()
	defer func() {
		lock.Unlock()
		releaseRepoLock(repoID)
	}()

	repoPath := filepath.Join(getGitCacheDir(), repoID)
	return action(repoPath)
}

// --- Repo Management ---

func ensureBareRepo(repoURL, cacheRoot string) error {
	repoID := SanitizeRepoID(repoURL)
	repoPath := filepath.Join(cacheRoot, repoID)

	if _, err := os.Stat(repoPath); os.IsNotExist(err) {
		return initBareRepo(repoURL, repoPath)
	}
	return updateBareRepo(repoPath)
}

func initBareRepo(repoURL, targetDir string) error {
	if err := os.MkdirAll(filepath.Dir(targetDir), 0755); err != nil {
		return fmt.Errorf("failed to create target directory: %w", err)
	}

	// _, err := git.PlainClone(targetDir, &git.CloneOptions{
	// 	URL:          repoURL,
	// 	Mirror:       true,
	// 	Depth:        1,
	// 	NoCheckout:   true,
	// 	SingleBranch: false,
	// 	Tags:         git.AllTags,
	// 	Filter:       packp.FilterTreeDepth(0),
	// 	Bare:         true,
	// })

	cmd := exec.Command("git", "clone", "--no-single-branch", "--depth", "1", "--no-checkout", "--filter=tree:0", repoURL, targetDir)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("git clone failed: %w", err)
	}

	return nil
}

func updateBareRepo(repoPath string) error {
	cmd := exec.Command("git", "-C", repoPath, "remote", "update", "--prune")
	cmd.Stdout = nil // oder os.Stdout für Debug-Ausgaben
	cmd.Stderr = nil
	return cmd.Run()
}

// --- Helpers ---

func SanitizeRepoID(repoURL string) string {
	h := sha1.New()
	h.Write([]byte(repoURL))
	return hex.EncodeToString(h.Sum(nil))
}

func getGitCacheDir() string {
	dir := os.Getenv("GIT_CACHE_DIR")
	if dir == "" {
		dir = "/tmp/gitcache"
	}
	return dir
}
