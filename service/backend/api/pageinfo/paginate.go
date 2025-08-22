package pageinfo

import "githubclone-backend/api/common"

func PaginateSlice[T any](items []T, page int, pageSize int) ([]T, common.PageInfoNext) {
	start := (page - 1) * pageSize
	end := start + pageSize
	pageinfo := common.PageInfoNext{}

	if start >= len(items) {
		pageinfo.HasPreviousPage = len(items) > 0
		pageinfo.HasNextPage = false
		return []T{}, pageinfo
	}
	if end > len(items) {
		end = len(items)
	}
	pageinfo.HasPreviousPage = page > 1 && len(items) > 0
	pageinfo.HasNextPage = end < len(items) && len(items) > 0

	return items[start:end], pageinfo
}
