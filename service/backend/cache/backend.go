package cache

type CacheBackend interface {
	Get(key string, dest interface{}) (bool, error)
	Set(key string, val interface{}, persist bool) error
}
