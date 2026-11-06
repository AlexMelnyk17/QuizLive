using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace QuizLive.Server.Application.Common
{
    public record PageQuery(
        [Range(1, int.MaxValue)] int Page = 1,
        [Range(1, PageQuery.MaxPageSize)] int PageSize = PageQuery.DefaultPageSize)
    {
        public const int DefaultPageSize = 20;
        public const int MaxPageSize = 100;
    }

    public record PagedResult<T>(
        List<T> Items,
        int Page,
        int PageSize,
        int TotalCount)
    {
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    }

    public static class PaginationExtensions
    {
        /// <summary>
        /// Returns one page of an already ordered query together with the total count.
        /// </summary>
        public static async Task<PagedResult<T>> ToPagedResultAsync<T>(this IQueryable<T> query, PageQuery page)
        {
            var totalCount = await query.CountAsync();

            // long, щоб великий номер сторінки не переповнив int; сторінка за межами — порожній список без запиту.
            var skip = (long)(page.Page - 1) * page.PageSize;
            if (skip >= totalCount)
            {
                return new PagedResult<T>([], page.Page, page.PageSize, totalCount);
            }

            var items = await query
                .Skip((int)skip)
                .Take(page.PageSize)
                .ToListAsync();

            return new PagedResult<T>(items, page.Page, page.PageSize, totalCount);
        }
    }
}
