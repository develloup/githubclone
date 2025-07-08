package cachable

import (
	"githubclone-backend/config"
	"log"
)

func (f *CacheFacade) GetConfigValue(key string) (string, error) {
	val, found, err := f.ConfigValueCache.Get(key)
	if err != nil {
		return "", err
	}
	if found {
		log.Printf("GetConfigValue: %s, return %s", key, val.Value)
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

func (f *CacheFacade) SetConfigValue(key, value string) error {
	log.Printf("SetConfigValue: %s = %s", key, value)
	// Persist in DB
	if err := config.SetConfiguration(key, value); err != nil {
		return err
	}
	// Update Cache
	return f.ConfigValueCache.Set(key, ConfigurationValue{Value: value})
}
