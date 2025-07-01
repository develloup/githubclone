package cachable

import (
	"context"
	"githubclone-backend/config"
)

func (f *CacheFacade) GetConfigValue(ctx context.Context, key string) (string, error) {
	val, found, err := f.ConfigValueCache.Get(key)
	if err != nil {
		return "", err
	}
	if found {
		return val.Value, nil
	}

	// Fallback to the db
	value, err := config.GetConfiguration(key)
	if err != nil {
		return "", err
	}

	// Put back in cache
	_ = f.ConfigValueCache.Set(key, ConfigurationValue{Value: value})
	return value, nil
}

func (f *CacheFacade) SetConfigValue(ctx context.Context, key, value string) error {
	// Persist in DB
	if err := config.SetConfiguration(key, value); err != nil {
		return err
	}
	// Update Cache
	return f.ConfigValueCache.Set(key, ConfigurationValue{Value: value})
}
