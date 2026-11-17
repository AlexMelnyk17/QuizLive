using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Common;

namespace QuizLive.Server.Tests.Common;

public class PaginationTests
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Theory]
    [InlineData(1, 2, new[] { 1, 2 })]
    [InlineData(2, 2, new[] { 3, 4 })]
    [InlineData(3, 2, new[] { 5 })]
    [InlineData(4, 2, new int[0])]
    [InlineData(int.MaxValue, 100, new int[0])]
    public async Task Paging_ReturnsOrderedSliceAndFullCount(int page, int pageSize, int[] expectedIds)
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(Ct);
        await using var db = new PagingDbContext(new DbContextOptionsBuilder<PagingDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync(Ct);
        db.Items.AddRange(Enumerable.Range(1, 5).Select(id => new PageItem { Id = id }));
        await db.SaveChangesAsync(Ct);

        var result = await db.Items.OrderBy(item => item.Id).ToPagedResultAsync(new PageQuery(page, pageSize));

        Assert.Equal(expectedIds, result.Items.Select(item => item.Id));
        Assert.Equal(page, result.Page);
        Assert.Equal(pageSize, result.PageSize);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(pageSize == 2 ? 3 : 1, result.TotalPages);
    }

    [Fact]
    public async Task EmptyQuery_ReturnsEmptyPageWithZeroTotalPages()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(Ct);
        await using var db = new PagingDbContext(new DbContextOptionsBuilder<PagingDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync(Ct);

        var result = await db.Items.OrderBy(item => item.Id).ToPagedResultAsync(new PageQuery());

        Assert.Empty(result.Items);
        Assert.Equal(1, result.Page);
        Assert.Equal(PageQuery.DefaultPageSize, result.PageSize);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
    }

    private sealed class PagingDbContext(DbContextOptions<PagingDbContext> options) : DbContext(options)
    {
        public DbSet<PageItem> Items => Set<PageItem>();
    }

    private sealed class PageItem
    {
        public int Id { get; set; }
    }
}
